import { Buffer } from 'node:buffer'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { decodeHTMLStrict } from 'entities'
import { getCanvasKit, fontManager, loadImage } from './assetLoaders'
import { SocialCardGenerationError } from './SocialCardGenerationError'
import type { RGBColor, SocialCardImageOptions } from './types'

type CanvasKitInstance = Awaited<ReturnType<typeof getCanvasKit>>
type CanvasSurface = NonNullable<ReturnType<CanvasKitInstance['MakeSurface']>>
type Canvas = ReturnType<CanvasSurface['getCanvas']>
type CanvasFontWeight = CanvasKitInstance['FontWeight']['Normal']

const width = 1200
const height = 630
const padding = 80
const avatarSize = [140, 140] as const
const defaultGradient: RGBColor[] = [[0, 0, 0]]
const titleFontFamilies = ['Lora']
const descriptionFontFamilies = ['Lora']
const titleStyle = {
  color: [255, 255, 255] as RGBColor,
  size: 86,
  lineHeight: 96 / 86,
}
const descriptionStyle = {
  color: [226, 232, 240] as RGBColor,
  size: 48,
  lineHeight: 58 / 48,
}

export async function generateOpenGraphImage({
  title,
  description = '',
  bgGradient = defaultGradient,
  avatarUrl,
}: SocialCardImageOptions): Promise<Buffer> {
  const { titleFontPath, descriptionFontPath } = resolveFontPaths()
  const fontMgr = await fontManager.get([titleFontPath, descriptionFontPath])
  const avatarBuffer = await loadImage(avatarUrl)
  const CanvasKit = await getCanvasKit()
  const surface = CanvasKit.MakeSurface(width, height)

  if (!surface) {
    throw new SocialCardGenerationError('create-surface', 'CanvasKit could not create a render surface', {
      width,
      height,
    })
  }

  try {
    const canvas = surface.getCanvas()
    drawBackground(CanvasKit, canvas, bgGradient)
    const avatarHeight = drawAvatar(CanvasKit, canvas, avatarBuffer, avatarUrl)
    drawText(CanvasKit, canvas, fontMgr, title, description, avatarHeight)

    const image = surface.makeImageSnapshot()
    const imageBytes = image.encodeToBytes(CanvasKit.ImageFormat.PNG, 100)

    if (!imageBytes || imageBytes.length === 0) {
      throw new SocialCardGenerationError('encode-image', 'CanvasKit returned an empty social card image')
    }

    return Buffer.from(imageBytes)
  } catch (error) {
    if (error instanceof SocialCardGenerationError) {
      throw error
    }

    throw new SocialCardGenerationError(
      'render-card',
      'Unexpected social card rendering failure',
      {
        avatarUrl,
      },
      { cause: error }
    )
  } finally {
    surface.dispose()
  }
}

const drawBackground = (
  CanvasKit: CanvasKitInstance,
  canvas: Canvas,
  bgGradient: RGBColor[]
) => {
  const bgRect = CanvasKit.XYWHRect(0, 0, width, height)
  const bgPaint = new CanvasKit.Paint()

  bgPaint.setShader(
    CanvasKit.Shader.MakeLinearGradient(
      [0, 0],
      [0, height],
      bgGradient.map(rgb => CanvasKit.Color(...rgb)),
      null,
      CanvasKit.TileMode.Clamp
    )
  )

  canvas.drawRect(bgRect, bgPaint)
}

const drawAvatar = (
  CanvasKit: CanvasKitInstance,
  canvas: Canvas,
  avatarBuffer: Buffer,
  avatarUrl: string
): number => {
  const avatarImage = CanvasKit.MakeImageFromEncoded(avatarBuffer)

  if (!avatarImage) {
    throw new SocialCardGenerationError('load-avatar', 'Avatar image could not be decoded for social card generation', {
      avatarUrl,
    })
  }

  const [avatarWidth, avatarHeight] = avatarSize
  const sourceWidth = avatarImage.width()
  const sourceHeight = avatarImage.height()
  const xRatio = avatarWidth / sourceWidth
  const yRatio = avatarHeight / sourceHeight
  const imagePaint = new CanvasKit.Paint()

  imagePaint.setImageFilter(
    CanvasKit.ImageFilter.MakeMatrixTransform(
      CanvasKit.Matrix.scaled(xRatio, yRatio),
      { filter: CanvasKit.FilterMode.Linear },
      null
    )
  )

  canvas.drawImage(avatarImage, padding / xRatio, padding / yRatio, imagePaint)

  return avatarHeight
}

const drawText = (
  CanvasKit: CanvasKitInstance,
  canvas: Canvas,
  fontMgr: Awaited<ReturnType<typeof fontManager.get>>,
  title: string,
  description: string,
  avatarHeight: number
) => {
  const paragraphStyle = new CanvasKit.ParagraphStyle({
    textAlign: CanvasKit.TextAlign.Left,
    textDirection: CanvasKit.TextDirection.LTR,
    textStyle: buildTextStyle(CanvasKit, titleStyle, titleFontFamilies, CanvasKit.FontWeight.Bold),
  })
  const paragraphBuilder = CanvasKit.ParagraphBuilder.Make(paragraphStyle, fontMgr)

  paragraphBuilder.addText(decodeHTMLStrict(title))
  paragraphBuilder.pushStyle(new CanvasKit.TextStyle({ fontSize: padding / 3, heightMultiplier: 1 }))
  paragraphBuilder.addText('\n\n')
  paragraphBuilder.pushStyle(
    new CanvasKit.TextStyle(
      buildTextStyle(CanvasKit, descriptionStyle, descriptionFontFamilies, CanvasKit.FontWeight.Normal)
    )
  )
  paragraphBuilder.addText(decodeHTMLStrict(description))

  const paragraph = paragraphBuilder.build()
  const paragraphWidth = width - padding * 3
  paragraph.layout(paragraphWidth)

  const minTop = padding + avatarHeight + padding
  const maxTop = minTop + padding
  const naturalTop = height - padding - paragraph.getHeight()
  const paragraphTop = Math.max(minTop, Math.min(maxTop, naturalTop))

  canvas.drawParagraph(paragraph, padding, paragraphTop)
}

const buildTextStyle = (
  CanvasKit: CanvasKitInstance,
  style: { color: RGBColor; size: number; lineHeight: number },
  fontFamilies: string[],
  fontWeight: CanvasFontWeight
) => ({
  color: CanvasKit.Color(...style.color),
  fontFamilies,
  fontSize: style.size,
  fontStyle: { weight: fontWeight },
  heightMultiplier: style.lineHeight,
})

const resolveFontPaths = (): { descriptionFontPath: string; titleFontPath: string } => ({
  titleFontPath: resolveLocalAssetPath(
    'resolve-title-font',
    [
      new URL('../../../../../public/fonts/Serif-Lora/Lora-Bold.ttf', import.meta.url),
      new URL('../../../../../public/fonts/Lora-Bold.ttf', import.meta.url),
    ],
    'title font'
  ),
  descriptionFontPath: resolveLocalAssetPath(
    'resolve-description-font',
    [
      new URL('../../../../../public/fonts/Serif-Lora/Lora-Regular.ttf', import.meta.url),
      new URL('../../../../../public/fonts/Lora-Regular.ttf', import.meta.url),
    ],
    'description font'
  ),
})

const resolveLocalAssetPath = (
  stage: 'resolve-description-font' | 'resolve-title-font',
  candidateUrls: URL[],
  label: string
): string => {
  const candidatePaths = candidateUrls.map(candidateUrl => fileURLToPath(candidateUrl))

  for (const candidatePath of candidatePaths) {
    if (existsSync(candidatePath)) {
      return candidatePath
    }
  }

  throw new SocialCardGenerationError(stage, `Social card ${label} could not be resolved`, {
    candidatePaths,
    label,
  })
}
