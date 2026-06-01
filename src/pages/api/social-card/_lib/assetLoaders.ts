import type { CanvasKit, FontMgr } from 'canvaskit-wasm/full'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { SocialCardGenerationError } from './SocialCardGenerationError'

const moduleRequire = createRequire(import.meta.url)

let canvasKitSingleton: CanvasKit | undefined

export async function getCanvasKit(): Promise<CanvasKit> {
  if (canvasKitSingleton) {
    return canvasKitSingleton
  }

  try {
    const { default: init } = await import('canvaskit-wasm/full')

    canvasKitSingleton = await init({
      locateFile: file => moduleRequire.resolve(`canvaskit-wasm/bin/full/${file}`),
    })

    return canvasKitSingleton
  } catch (cause) {
    throw new SocialCardGenerationError(
      'init-canvaskit',
      'Failed to initialize CanvasKit for social card generation',
      {
        module: 'canvaskit-wasm/full',
      },
      { cause }
    )
  }
}

class FontManager {
  readonly #cache = new Map<string, ArrayBuffer>()
  #manager?: FontMgr

  async #getOrCreateManager(shouldUpdate: boolean): Promise<FontMgr> {
    if (!shouldUpdate && this.#manager) {
      return this.#manager
    }

    const CanvasKit = await getCanvasKit()
    const fontData = Array.from(this.#cache.values())
    const manager = CanvasKit.FontMgr.FromData(...fontData)

    if (!manager) {
      throw new SocialCardGenerationError('load-fonts', 'Failed to create CanvasKit font manager', {
        fontCount: fontData.length,
      })
    }

    this.#manager = manager
    return manager
  }

  async get(fontPaths: string[]): Promise<FontMgr> {
    let hasNew = false

    for (const fontPath of fontPaths) {
      if (this.#cache.has(fontPath)) {
        continue
      }

      hasNew = true

      try {
        const fontFile = await fs.readFile(fontPath)
        const fontData = fontFile.buffer.slice(
          fontFile.byteOffset,
          fontFile.byteOffset + fontFile.byteLength
        )
        this.#cache.set(fontPath, fontData)
      } catch (cause) {
        throw new SocialCardGenerationError(
          'load-fonts',
          'Failed to load a local font file for social card generation',
          {
            fontPath,
          },
          { cause }
        )
      }
    }

    return this.#getOrCreateManager(hasNew)
  }
}

export const fontManager = new FontManager()

const imageCache = new Map<string, Buffer>()

export const loadImage = async (imageUrl: string): Promise<Buffer> => {
  const cachedImage = imageCache.get(imageUrl)
  if (cachedImage) {
    return cachedImage
  }

  try {
    const response = await fetch(imageUrl)

    if (!response.ok) {
      throw new SocialCardGenerationError(
        'load-avatar',
        'Failed to fetch the social card avatar asset',
        {
          imageUrl,
          status: response.status,
          statusText: response.statusText,
        }
      )
    }

    const image = Buffer.from(await response.arrayBuffer())
    imageCache.set(imageUrl, image)
    return image
  } catch (cause) {
    if (cause instanceof SocialCardGenerationError) {
      throw cause
    }

    throw new SocialCardGenerationError(
      'load-avatar',
      'Failed to fetch the social card avatar asset',
      {
        imageUrl,
      },
      { cause }
    )
  }
}
