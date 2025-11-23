/**
 * Favicon Generator Integration
 *
 * Generates favicon files and PWA icons from a source SVG at build time.
 * Runs during both development and production builds.
 *
 * Generated files:
 * - favicon.ico (32x32, 64x64 multi-resolution)
 * - apple-touch-icon.png (180x180 for iOS)
 * - icon-192.png (192x192 PWA icon)
 * - icon-512.png (512x512 PWA icon)
 * - icon-mask.png (512x512 maskable PWA icon)
 *
 * @see https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs
 * @see https://maskable.app/ - Test maskable icons
 */

import sharp, { type Metadata } from 'sharp'
import toIco from 'to-ico'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { resolve } from 'node:path'
import type { AstroIntegration } from 'astro'
import { BuildError } from '../../lib/errors/BuildError'

type IconGenerator = (_options: Metadata) => Promise<Buffer>

/**
 * Generate ICO favicon with multiple resolutions (32x32, 64x64)
 * @internal
 */
export const generateIcoFavicon = (faviconPath: string): IconGenerator => async ({ width, height, density }) => {
  if (!width || !height || !density) {
    throw new BuildError(
      'Required metadata (width, height, density) not available for ICO generation',
      { phase: 'favicon-generation', filePath: faviconPath }
    )
  }
  const faviconDimensions = [32, 64]

  const buffers = await Promise.all(
    faviconDimensions.map(dimension =>
      sharp(faviconPath, {
        density: (dimension / Math.max(width, height)) * density,
      })
        .resize(dimension, dimension)
        .toBuffer()
    )
  )

  return toIco(buffers)
}

/**
 * Generate Apple Touch Icon (180x180)
 * @internal
 */
export const generatePngFavicon = (faviconPath: string): IconGenerator => ({ density, width, height }) => {
  if (!width || !height || !density) {
    throw new BuildError(
      'Required metadata (width, height, density) not available for PNG generation',
      { phase: 'favicon-generation', filePath: faviconPath }
    )
  }
  return sharp(faviconPath, {
    density: (180 / Math.max(width, height)) * density,
  })
    .resize(180, 180)
    .png()
    .toBuffer()
}

/**
 * Generate PWA icon at specified size
 * @internal
 */
export const generatePwaIcon = (faviconPath: string, size: number): IconGenerator => ({ density, width, height }) => {
  if (!width || !height || !density) {
    throw new BuildError(
      `Required metadata (width, height, density) not available for ${size}x${size} PWA icon generation`,
      { phase: 'favicon-generation', filePath: faviconPath }
    )
  }
  return sharp(faviconPath, {
    density: (size / Math.max(width, height)) * density,
  })
    .resize(size, size)
    .png()
    .toBuffer()
}

/**
 * Save buffer to file
 */
const saveFile = (destination: string) => async (buffer: Buffer): Promise<void> => {
  await writeFile(destination, new Uint8Array(buffer))
}

/**
 * Generate all favicon variants
 */
async function generateFavicons(faviconPath: string, outputDir: string): Promise<void> {
  // Validate source file exists
  if (!existsSync(faviconPath)) {
    throw new BuildError(
      `Source favicon not found at ${faviconPath}. Please ensure src/assets/favicon.svg exists.`,
      { phase: 'favicon-generation', filePath: faviconPath }
    )
  }

  const metadata = await sharp(faviconPath).metadata()

  // Validate it's an SVG
  if (metadata.format !== 'svg') {
    throw new BuildError(
      `Source favicon must be SVG format, got ${metadata.format}`,
      { phase: 'favicon-generation', filePath: faviconPath }
    )
  }

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true })

  // Define favicon types to generate
  const faviconTypes: Array<[string, IconGenerator]> = [
    ['favicon.ico', generateIcoFavicon(faviconPath)],
    ['apple-touch-icon.png', generatePngFavicon(faviconPath)],
    ['icon-192.png', generatePwaIcon(faviconPath, 192)],
    ['icon-512.png', generatePwaIcon(faviconPath, 512)],
    ['icon-mask.png', generatePwaIcon(faviconPath, 512)],
  ]

  // Generate all favicons in parallel
  const results = await Promise.allSettled(
    faviconTypes.map(async ([name, generator]) => {
      const buffer = await generator(metadata)
      await saveFile(`${outputDir}/${name}`)(buffer)
    })
  )

  // Check if any failed and throw the first error
  const firstRejection = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  )
  if (firstRejection) {
    throw firstRejection.reason
  }

  console.log('✅ Favicons and PWA icons generated successfully')
}

/**
 * Astro integration that generates favicons from SVG source
 */
export function faviconGenerator(): AstroIntegration {
  let faviconPath: string
  let outputDir: string

  return {
    name: 'favicon-generator',
    hooks: {
      'astro:config:setup': async ({ config }) => {
        // Resolve paths relative to project root
        // config.root is a URL, need to convert to file path
        const projectRoot = config.root.pathname.replace(/^\/([A-Z]:)/, '$1') // Handle Windows paths
        faviconPath = resolve(decodeURI(projectRoot), 'src/assets/favicon.svg')
        outputDir = resolve(decodeURI(projectRoot), 'public')

        // Generate favicons
        try {
          await generateFavicons(faviconPath, outputDir)
        } catch (error) {
          if (error instanceof BuildError) {
            throw error
          }
          throw new BuildError(
            `Failed to generate favicons: ${error instanceof Error ? error.message : String(error)}`,
            { phase: 'favicon-generation', cause: error }
          )
        }
      },
    },
  }
}
