const { socialImagesDir } = require(`../../scripts/build/paths`)

/**
 * Absolute URL link to a social image for the page to use as share image
 *
 * @param {object} eleventyConfig Config object curried by loading script in .eleventy.js
 * @param {string} slug The slug for this page
 * @returns {string} The formatted page description
 *
 * Usage:
 * {% pageSocialImg this.page.fileSlug %}
 */
function pageSocialImg(eleventyConfig, slug) {
  const baseUrl = eleventyConfig.globalData.site.baseUrl
  const slugWithDefault = slug ?? 'home'
  return `${baseUrl}/${socialImagesDir}/${slugWithDefault}.png`
}

exports.pageSocialImg = pageSocialImg
