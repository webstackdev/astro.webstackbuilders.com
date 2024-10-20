// @TODO: See scripts/build/favicon.ts
/**
 * Convert the logo SVG file to PNG favicons for use in the PWA manifest.njk
 */
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { createConverter } from 'convert-svg-to-png'
import type { TaskFunction } from 'gulp'
import { log } from "@lib/logger"

const cacheDir = `.cache`

/**
 * Source SVG file to use for generating favicon files
 */
const faviconSvgSourceFilename = `src/assets/images/site/logo.svg`
const faviconSvgBuildDir = `public/images/favicons`
const manifestIconSmallFilename = `favicon-webapp-192x192.png`
const manifestIconLargeFilename = `favicon-webapp-512x512.png`

interface ManifestIconFileMetadata {
  fileName: string
  height: number
  width: number
}

const manifestIconFiles: ManifestIconFileMetadata[] = [
  {
    fileName: manifestIconSmallFilename,
    height: 192,
    width: 192,
  },
  {
    fileName: manifestIconLargeFilename,
    height: 512,
    width: 512,
  },
]

  export const getCachedFilePaths = () => manifestIconFiles.map(iconMeta => {
    return resolve(`${cacheDir}/favicon`, iconMeta.fileName)
  })

export const areFilesCached = () => {
  const cachedFilePaths = getCachedFilePaths()
  return cachedFilePaths.every(filePath => {
    if (existsSync(filePath)) return true
    return false
  })
}

export const statBuildDir = () => {
  if (!existsSync(faviconSvgBuildDir)) throw new Error(
    `Favicon build directory does not exist: ${faviconSvgBuildDir}`
  )
}

export const copyCachedFiles = () => {
  log(` Copying cached manifest icon files to build directory`, `yellow`)
  manifestIconFiles.forEach(fileMeta => {
    const srcFilePath = resolve(`${cacheDir}/favicon`, fileMeta.fileName)
    const destFilePath = resolve(faviconSvgBuildDir, fileMeta.fileName)
    copyFileSync(srcFilePath, destFilePath)
  })
}

export const addFilesToCache = () => {
  const faviconCacheDir = resolve(`${cacheDir}/favicon`)
  if (!existsSync(faviconCacheDir)) {
    mkdirSync(faviconCacheDir)
    log(` Creating cache directory for favicons`, `yellow`)
  }
  log(` Adding manifest icon images to cache`, `yellow`)
  manifestIconFiles.forEach(fileMeta => {
    const srcFilePath = resolve(faviconSvgBuildDir, fileMeta.fileName)
    const destFilePath = resolve(`${cacheDir}/favicon`, fileMeta.fileName)
    copyFileSync(srcFilePath, destFilePath)
  })
}

export async function convertSvgFiles() {
  const converter = createConverter()
  try {
    for (const fileMeta of manifestIconFiles) {
      const inputFilePath = resolve(faviconSvgSourceFilename)
      const outputFilePath = resolve(faviconSvgBuildDir, fileMeta.fileName)
      const output = await converter.convertFile(inputFilePath, {
        outputFilePath,
        height: fileMeta.height,
        width: fileMeta.width,
      })
      log(` Added manifest icon image to ${output}`, `yellow`)
    }
  } finally {
    await converter.destroy()
  }
}

const task: TaskFunction = async done => {
  log(`Generating PNG icon files for the manifest.njk template to use in PWAs`)

  if (areFilesCached()) {
    copyCachedFiles()
    done()
    return
  }

  try {
    statBuildDir()
    await convertSvgFiles()
    addFilesToCache()
    done()
    return
  } catch (err) {
    if (err instanceof Error) {
      done(err)
      return
    }
    throw err
  }
}

export default task
