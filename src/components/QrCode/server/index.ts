import { readFile } from 'node:fs/promises'
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
const LOGO_OUTER_COLOR = '#000000'
const LOGO_INNER_COLOR = '#6b7280'
const LOGO_BACKDROP_COLOR = '#ffffff'
const logoSvgFileUrl = new URL('../../../assets/images/site/logo.svg', import.meta.url)

let cachedLogoSvg: string | null = null

export interface RenderQrCodeSvgOptions {
	data: string
	size?: number
}

const getMonochromeLogoSvg = async (): Promise<string> => {
	if (cachedLogoSvg) {
		return cachedLogoSvg
	}

	const logoSvg = await readFile(logoSvgFileUrl, 'utf8')

	cachedLogoSvg = logoSvg
		.replace(/var\(--color-content-inverse\)/g, LOGO_OUTER_COLOR)
		.replace(/var\(--color-primary\)/g, LOGO_INNER_COLOR)

	return cachedLogoSvg
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
		const { height: logoHeight, width: logoWidth } = parseLogoViewBox(logoRoot.getAttribute('viewBox'))

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
	const logoSvgMarkup = await getMonochromeLogoSvg()

	const qrCode = new QRCodeStyling({
		backgroundOptions: {
			color: QR_BACKGROUND_COLOR,
		},
		cornersDotOptions: {
			color: QR_CORNER_DOT_COLOR,
			type: 'dot',
		},
		cornersSquareOptions: {
			color: QR_CORNER_COLOR,
			type: 'extra-rounded',
		},
		data,
		dotsOptions: {
			color: QR_DOT_COLOR,
			type: 'rounded',
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

	qrCode.applyExtension(createLogoExtension(logoSvgMarkup))

	const svgBuffer = await qrCode.getRawData('svg')

	if (!svgBuffer) {
		throw new Error('Failed to generate QR code SVG')
	}

	return String(svgBuffer)
}
