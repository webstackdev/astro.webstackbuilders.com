import QRCodeStyling from 'qr-code-styling'
import { JSDOM } from 'jsdom'

const SVG_NS = 'http://www.w3.org/2000/svg'
const DEFAULT_SIZE = 240
const DEFAULT_LOGO_WIDTH = 88.360085
const DEFAULT_LOGO_HEIGHT = 86.394562
const QR_DOT_COLOR = '#000000'
const QR_CORNER_COLOR = '#4b5563'
const QR_CORNER_DOT_COLOR = '#111111'
const QR_BACKGROUND_COLOR = '#ffffff'
const LOGO_BACKDROP_COLOR = '#ffffff'
const LOGO_SVG_MARKUP = `<svg
	id="logo"
	title="Webstack Builders Company Logo"
	width="88.360085"
	height="86.394562"
	viewBox="0 0 88.360085 86.394562"
	xmlns="http://www.w3.org/2000/svg"
>
	<g
		id="logo-group"
		transform="translate(-64.234499,-91.339148)"
	>
		<path
			fill="#000000"
			id="logo-block-top-left"
			d="M 64.234499,105.965 V 91.339148 h 8.904504 8.904505 V 105.965 120.59085 h -8.904505 -8.904504 z"
		/>
		<path
			fill="#000000"
			id="logo-block-top-middle"
			d="M 88.893126,105.965 V 91.339148 H 109.0995 129.30588 V 105.965 120.59085 H 109.0995 88.893126 Z"
		/>
		<path
			fill="#000000"
			id="logo-block-top-right"
			d="M 134.78557,105.965 V 91.339148 h 8.90451 8.9045 V 105.965 120.59085 h -8.9045 -8.90451 z"
		/>
		<path
			fill="#6b7280"
			id="logo-block-middle-left"
			d="m 64.234499,134.53643 v -8.5034 h 20.548856 20.548855 v 8.5034 8.5034 H 84.783355 64.234499 Z"
		/>
		<path
			fill="#6b7280"
			id="logo-block-middle-right"
			d="m 111.49687,134.53643 v -8.5034 h 20.54885 20.54886 v 8.5034 8.5034 h -20.54886 -20.54885 z"
		/>
		<path
			fill="#000000"
			id="logo-block-bottom-left"
			d="m 64.234499,163.10786 v -14.62585 h 8.904504 8.904505 v 14.62585 14.62585 h -8.904505 -8.904504 z"
		/>
		<path
			fill="#000000"
			id="logo-block-bottom-middle"
			d="m 88.893126,163.10786 v -14.62585 h 20.206374 20.20638 v 14.62585 14.62585 H 109.0995 88.893126 Z"
		/>
		<path
			fill="#000000"
			id="logo-block-bottom-right"
			d="m 134.78557,163.10786 v -14.62585 h 8.90451 8.9045 v 14.62585 14.62585 h -8.9045 -8.90451 z"
		/>
	</g>
</svg>`

export interface RenderQrCodeSvgOptions {
  data: string
  size?: number
}

const parseLogoViewBox = (viewBox: null | string): { height: number; width: number } => {
  if (!viewBox) {
    return {
      height: DEFAULT_LOGO_HEIGHT,
      width: DEFAULT_LOGO_WIDTH,
    }
  }

  const parts = viewBox
    .trim()
    .split(/\s+/)
    .map(value => Number(value))

  const width = parts[2] ?? Number.NaN
  const height = parts[3] ?? Number.NaN

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return {
      height: DEFAULT_LOGO_HEIGHT,
      width: DEFAULT_LOGO_WIDTH,
    }
  }

  return { height, width }
}

const createLogoExtension = (logoSvgMarkup: string) => {
  return (svg: SVGElement, options: { height?: number; width?: number }) => {
    const document = svg.ownerDocument
    const window = document.defaultView

    if (!window) {
      return
    }

    const parsedLogo = new window.DOMParser().parseFromString(logoSvgMarkup, 'image/svg+xml')
    const logoRoot = parsedLogo.documentElement
    const { height: logoHeight, width: logoWidth } = parseLogoViewBox(
      logoRoot.getAttribute('viewBox')
    )

    const qrWidth = options.width ?? DEFAULT_SIZE
    const qrHeight = options.height ?? DEFAULT_SIZE
    const logoDisplayWidth = Math.min(qrWidth, qrHeight) * 0.24
    const logoDisplayHeight = logoDisplayWidth * (logoHeight / logoWidth)
    const backdropPadding = Math.min(qrWidth, qrHeight) * 0.045
    const logoX = (qrWidth - logoDisplayWidth) / 2
    const logoY = (qrHeight - logoDisplayHeight) / 2

    const backdrop = document.createElementNS(SVG_NS, 'rect')
    backdrop.setAttribute('x', String(logoX - backdropPadding))
    backdrop.setAttribute('y', String(logoY - backdropPadding))
    backdrop.setAttribute('width', String(logoDisplayWidth + backdropPadding * 2))
    backdrop.setAttribute('height', String(logoDisplayHeight + backdropPadding * 2))
    backdrop.setAttribute('rx', String(backdropPadding * 1.5))
    backdrop.setAttribute('fill', LOGO_BACKDROP_COLOR)

    const logoGroup = document.createElementNS(SVG_NS, 'g')
    logoGroup.setAttribute(
      'transform',
      `translate(${logoX} ${logoY}) scale(${logoDisplayWidth / logoWidth} ${logoDisplayHeight / logoHeight})`
    )

    Array.from(logoRoot.childNodes).forEach(node => {
      logoGroup.appendChild(document.importNode(node, true))
    })

    svg.appendChild(backdrop)
    svg.appendChild(logoGroup)
  }
}

/**
 * Render a QR code SVG string during SSR/build so pages do not need client-side hydration.
 */
export const renderQrCodeSvg = async ({
  data,
  size = DEFAULT_SIZE,
}: RenderQrCodeSvgOptions): Promise<string> => {
  const qrCode = new QRCodeStyling({
    backgroundOptions: {
      color: QR_BACKGROUND_COLOR,
    },
    cornersDotOptions: {
      color: QR_CORNER_DOT_COLOR,
      type: 'dots',
    },
    cornersSquareOptions: {
      color: QR_CORNER_COLOR,
      type: 'dots',
    },
    data,
    dotsOptions: {
      color: QR_DOT_COLOR,
      type: 'dots',
    },
    height: size,
    jsdom: JSDOM,
    margin: 8,
    qrOptions: {
      errorCorrectionLevel: 'H',
    },
    type: 'svg',
    width: size,
  })

  qrCode.applyExtension(createLogoExtension(LOGO_SVG_MARKUP))

  const svgBuffer = await qrCode.getRawData('svg')

  if (!svgBuffer) {
    throw new Error('Failed to generate QR code SVG')
  }

  return String(svgBuffer)
}
