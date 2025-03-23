/**
 * Make sure global data functions are working
 */
const { describe, expect, test } = require('@jest/globals')
const { getBuildPathsGlobalData, getSiteGlobalData, getStatsGlobalData } = require('../globalData')

describe('Build paths object works', () => {
  test('returns valid paths object', () => {
    const sut = getBuildPathsGlobalData()
    expect(sut).toBeInstanceOf(Object)
    /** Make sure that at least the build directory is set */
    expect(sut[`buildDir`]).toEqual(expect.any(String))
    expect(sut).toMatchInlineSnapshot(`
      {
        "articlesSourceDir": "src/pages/articles",
        "assetBuildDir": "public/assets",
        "assetSourceDir": "src/assets",
        "buildDir": "public",
        "buildPathsToClean": [
          "public",
        ],
        "buildPathsToCreate": [
          "public/css",
          "public/js",
          "public/fonts",
          "public/images",
          "public/images/previews",
          "tmp",
        ],
        "casestudiesSourceDir": "src/pages/case-studies",
        "contentSourceDir": "src/pages",
        "cssBuildDir": "public/css",
        "faviconSvgBuildDir": "public/favicons",
        "faviconSvgSourceFilename": "src/assets/images/site/favicon.svg",
        "fontsBuildDir": "public/fonts",
        "fontsSourceDir": "src/assets/fonts",
        "imagesBuildDir": "public/images",
        "imagesSourceDir": "src/assets/images",
        "jsBuildDir": "public/js",
        "jsSourceDir": "src/assets/script",
        "rssFeedBuildFilename": "feed/feed.xml",
        "scriptSourceGlobs": [
          "@types/**/*.{js,ts}",
          "eleventy/**/*.{js,ts}",
          "lambda/**/*.{js,ts}",
          "scripts/**/*.{js,ts}",
          "src/**/*.{js,ts}",
          "!node_modules/**",
        ],
        "scssSourceDir": "src/assets/scss",
        "scssWatchGlob": "src/assets/scss/**/*.scss",
        "servicesSourceDir": "src/pages/services",
        "siteImagesSourceDir": "src/assets/images/site",
        "sitemapBuildFilename": "/sitemap.xml",
        "socialImagesBuildDir": "public/images/previews",
        "socialImagesDir": "previews",
        "socialScssSourceFile": "src/assets/scss/socialimages.scss",
        "spritesBuildDir": "src/_layouts/images",
        "spritesSourceDir": "src/assets/icons",
        "testimonialsSourceDir": "src/pages/testimonials",
        "tmpDir": "tmp",
      }
    `)
  })
})

describe(`Returns global data objects`, () => {
  test(`Returns global site object`, () => {
    const sut = getSiteGlobalData()
    expect(sut).toBeInstanceOf(Object)
    expect(sut[`author`]).toEqual(expect.any(String))
    expect(sut[`baseUrl`]).toEqual(expect.any(String))
    expect(sut[`description`]).toEqual(expect.any(String))
    expect(sut[`domain`]).toEqual(expect.any(String))
    expect(sut[`email`]).toEqual(expect.any(String))
    expect(sut[`lang`]).toEqual(expect.any(String))
    expect(sut[`locale`]).toEqual(expect.any(String))
    expect(sut[`organization`]).toEqual(expect.any(String))
    expect(sut[`title`]).toEqual(expect.any(String))
  })

  test(`Returns global stats object`, () => {
    const sut = getStatsGlobalData()
    expect(sut).toBeInstanceOf(Object)
    expect(sut[`env`]).toEqual(expect.any(String))
    expect(sut[`timestamp`]).toEqual(expect.any(String))
  })
})

describe('Site stats global data works', () => {
  test('returns valid stats object', () => {
    expect(getStatsGlobalData()).toBeInstanceOf(Object)
  })
})
