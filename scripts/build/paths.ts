/**
 * File paths used in Gulp tasks. TypeScript with proper exports.
 */

export const buildDir = `public`
export const tmpDir = `tmp`
export const cacheDir = `.cache`

/**
 * Content source directories
 */
export const contentSourceDir = `src/pages`
export const articlesSourceDir = `${contentSourceDir}/articles`
export const casestudiesSourceDir = `${contentSourceDir}/case-studies`
export const homePageSourceDir = `${contentSourceDir}/home`
export const servicesSourceDir = `${contentSourceDir}/services`
export const sitePagesSourceDir = `${contentSourceDir}/site`
export const testimonialsSourceDir = `${contentSourceDir}/testimonials`

/**
 * Asset source directories
 */
export const assetSourceDir = `src/assets`
export const imagesSourceDir = `${assetSourceDir}/images`
export const jsSourceDir = `${assetSourceDir}/script`
export const scssSourceDir = `${assetSourceDir}/scss`

/**
 * Watch globs
 */
export const scssWatchGlob = `${scssSourceDir}/**/*.scss`

/**
 * Asset build target directories
 */
export const assetBuildDir = `${buildDir}/assets`
export const jsBuildDir = `${buildDir}/js`
export const cssBuildDir = `${buildDir}/css`
export const imagesBuildDir = `${buildDir}/images`

/**
 * Social share image files and styling source and build targets
 */
export const socialScssSourceFile = `${scssSourceDir}/socialimages.scss`
export const socialImagesDir = `previews`
export const socialImagesBuildDir = `${imagesBuildDir}/${socialImagesDir}`

/**
 * Source and build target directory for font files
 */
export const fontsSourceDir = `${assetSourceDir}/fonts`
export const fontsBuildDir = `${buildDir}/fonts`

/**
 * Source directory for site images
 */
export const siteImagesSourceDir = `${assetSourceDir}/images/site`

/**
 * Source and build target directory for sprite generation from SVG files
 */
export const spritesSourceDir = `${assetSourceDir}/icons`
export const spritesBuildDir = `src/_layouts/images`

/**
 * Array of globs that should be fed to Gulp src for dirs that should be linted
 */
export const scriptSourceGlobs: string[] = [
  `@types/**/*.{js,ts}`,
  `scripts/**/*.{js,ts}`,
  `src/**/*.{js,ts}`,
  `!node_modules/**`,
]

/**
 * Build target file for Sitemap for use in permalink in frontmatter
 */
export const sitemapBuildFilename = `/sitemap.xml`

/**
 * Build target file for RSS feed file for use in permalink in frontmatter
 */
export const rssFeedBuildFilename = `feed/feed.xml`

/**
 * Source SVG file to use for generating favicon files
 */
export const faviconSvgSourceFilename = `${imagesSourceDir}/site/logo.svg`
export const faviconSvgBuildDir = `${imagesBuildDir}/favicons`
export const manifestIconSmallFilename = `favicon-webapp-192x192.png`
export const manifestIconLargeFilename = `favicon-webapp-512x512.png`

/**
 * The build paths that will be removed by clean tasks before starting a new build
 */
export const buildPathsToClean: string[] = [buildDir]

/**
 * The build paths that should be present on a new build
 */
export const buildPathsToCreate: string[] = [
  cssBuildDir,
  jsBuildDir,
  fontsBuildDir,
  imagesBuildDir,
  socialImagesBuildDir,
  faviconSvgBuildDir,
  tmpDir,
]