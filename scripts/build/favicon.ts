// @TODO: See scripts/build/tasks/build:manifest-icons.ts
/**
 * https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs
 *
 * Maskable icons are used on Android devices. They are used as a mask for the device's theme
 * color. This means that the icon will be displayed in the theme color of the device, rather
 * than the color of the icon itself.
 *
 * Check if icon will work with mask: https://maskable.app/
 *
 * <link rel="icon" href="/favicon.ico" sizes="32x32">
 *
 * <link rel="icon" href="/icon.svg" type="image/svg+xml">
 *
 * <link rel="apple-touch-icon" href="/apple-touch-icon.png"><!-- 180×180 -->
 * { "src": "/icon-192.png", "type": "image/png", "sizes": "192x192" },
 * { "src": "/icon-512.png", "type": "image/png", "sizes": "512x512" }
 *
 * { "src": "/icon-mask.png", "type": "image/png", "sizes": "512x512", "purpose": "maskable" },
 */
import sharp, { type Metadata } from "sharp"
import toIco from "to-ico"
import { writeFile } from "fs/promises"

type IconGenerator = (options: Metadata) => Promise<Buffer>

const faviconPath = `src/assets/favicon.svg`
const generateIcoFavicon: IconGenerator = ({ width, height, density }) => {
  if (!width || !height || !density) throw new Error(`Required option not passed to generateIcoFavicon`)
  const faviconDimensions = [32, 64]
  // Create buffer for each size
  return Promise.all(
    faviconDimensions.map((dimension) =>
      sharp(faviconPath, {
        density: (dimension / Math.max(width, height)) * density,
      })
        .resize(dimension, dimension)
        .toBuffer()
    )
  ).then((buffers) => toIco(buffers))
}

const generatePngFavicon: IconGenerator = ({ density, width, height }) => {
  if (!width || !height || !density) throw new Error(`Required option not passed to generatePngFavicon`)
  return sharp(faviconPath, {
    density: (180 / Math.max(width, height)) * density,
  })
    .resize(180, 180)
    .png()
    .toBuffer()
}

const saveFile = (destination: string) => {
  return async (buffer: Buffer) => {
    return await writeFile(destination, buffer)
  }
}

const faviconTypes: Array<[string, IconGenerator]> = [
  ["favicon.ico", generateIcoFavicon],
  ["apple-touch-icon.png", generatePngFavicon],
]

export const buildFavicons = async () => {
  const metadata = await sharp(faviconPath).metadata()

  faviconTypes.forEach(([name, generator]) =>
    generator(metadata).then(
      saveFile(`${process.cwd()}/public/images/${name}`)
    )
  )
}
