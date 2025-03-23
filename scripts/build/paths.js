/**
 * File paths used in Gulp tasks and shortcodes. Javascript so importable anywhere.
 * Added to 'buildPaths' global object.
 */

const buildDir = `public`
exports.buildDir = buildDir

const tmpDir = `tmp`
exports.tmpDir = tmpDir

const cacheDir = `.cache`
exports.cacheDir = cacheDir

/**
 * Content source directories
 */
const contentSourceDir = `src/pages`
exports.contentSourceDir = contentSourceDir

const articlesSourceDir = `${contentSourceDir}/articles`
exports.articlesSourceDir = articlesSourceDir

const casestudiesSourceDir = `${contentSourceDir}/case-studies`
exports.casestudiesSourceDir = casestudiesSourceDir

const homePageSourceDir = `${contentSourceDir}/home`
exports.homePageSourceDir = homePageSourceDir

const servicesSourceDir = `${contentSourceDir}/services`
exports.servicesSourceDir = servicesSourceDir

const sitePagesSourceDir = `${contentSourceDir}/site`
exports.sitePagesSourceDir = sitePagesSourceDir

const testimonialsSourceDir = `${contentSourceDir}/testimonials`
exports.testimonialsSourceDir = testimonialsSourceDir

/**
 * Asset source directories
 */
const assetSourceDir = `src/assets`
exports.assetSourceDir = assetSourceDir

const imagesSourceDir = `${assetSourceDir}/images`
exports.imagesSourceDir = imagesSourceDir

const jsSourceDir = `${assetSourceDir}/script`
exports.jsSourceDir = jsSourceDir

const scssSourceDir = `${assetSourceDir}/scss`
exports.scssSourceDir = scssSourceDir

/**
 * Watch globs
 */

const scssWatchGlob = `${scssSourceDir}/**/*.scss`
exports.scssWatchGlob = scssWatchGlob

/**
 * Asset build target directories
 */
const assetBuildDir = `${buildDir}/assets`
exports.assetBuildDir = assetBuildDir

const jsBuildDir = `${buildDir}/js`
exports.jsBuildDir = jsBuildDir

const cssBuildDir = `${buildDir}/css`
exports.cssBuildDir = cssBuildDir

const imagesBuildDir = `${buildDir}/images`
exports.imagesBuildDir = imagesBuildDir

/**
 * Social share image files and styling source and build targets
 */
const socialScssSourceFile = `${scssSourceDir}/socialimages.scss`
exports.socialScssSourceFile = socialScssSourceFile

const socialImagesDir = `previews`
exports.socialImagesDir = socialImagesDir

const socialImagesBuildDir = `${imagesBuildDir}/${socialImagesDir}`
exports.socialImagesBuildDir = socialImagesBuildDir

/**
 * Source and build target directory for font files
 */
const fontsSourceDir = `${assetSourceDir}/fonts`
exports.fontsSourceDir = fontsSourceDir

const fontsBuildDir = `${buildDir}/fonts`
exports.fontsBuildDir = fontsBuildDir

/**
 * Source directory for site images
 */
const siteImagesSourceDir = `${assetSourceDir}/images/site`
exports.siteImagesSourceDir = siteImagesSourceDir

/**
 * Source and build target directory for sprite generation from SVG files
 */
const spritesSourceDir = `${assetSourceDir}/icons`
exports.spritesSourceDir = spritesSourceDir

const spritesBuildDir = `src/_layouts/images`
exports.spritesBuildDir = spritesBuildDir

/**
 * Array of blobs that should be fed to Gulp src for dirs that should be linted
 */
const scriptSourceGlobs = [
  `@types/**/*.{js,ts}`,
  `eleventy/**/*.{js,ts}`,
  `lambda/**/*.{js,ts}`,
  `scripts/**/*.{js,ts}`,
  `src/**/*.{js,ts}`,
  `!node_modules/**`,
]
exports.scriptSourceGlobs = scriptSourceGlobs

/**
 * Build target file for Sitemap for use in permalink in nunjucks template frontmatter
 */
const sitemapBuildFilename = `/sitemap.xml` // plugin does not take path to build directory
exports.sitemapBuildFilename = sitemapBuildFilename

/**
 * Build target file for RSS feed file for use in permalink in nunjucks template frontmatter
 */
const rssFeedBuildFilename = `feed/feed.xml` // plugin does not take path to build directory
exports.rssFeedBuildFilename = rssFeedBuildFilename

/**
 * Source SVG file to use for generating favicon files
 */
const faviconSvgSourceFilename = `${imagesSourceDir}/site/logo.svg`
exports.faviconSvgSourceFilename = faviconSvgSourceFilename

const faviconSvgBuildDir = `${imagesBuildDir}/favicons`
exports.faviconSvgBuildDir = faviconSvgBuildDir

const manifestIconSmallFilename = `favicon-webapp-192x192.png`
exports.manifestIconSmallFilename = manifestIconSmallFilename

const manifestIconLargeFilename = `favicon-webapp-512x512.png`
exports.manifestIconLargeFilename = manifestIconLargeFilename

/**
 * The build paths that will be removed by the `util:clean` task before starting a new build
 */
const buildPathsToClean = [buildDir]
exports.buildPathsToClean = buildPathsToClean

/**
 * The build paths that should be present on a new build
 */
const buildPathsToCreate = [
  cssBuildDir,
  jsBuildDir,
  fontsBuildDir,
  imagesBuildDir,
  socialImagesBuildDir,
  faviconSvgBuildDir,
  tmpDir,
]
exports.buildPathsToCreate = buildPathsToCreate
