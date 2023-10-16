/**
 * Front matter for Article items
 */
const { getCoverImageFilePath, getPermalinkPath } = require('../../../eleventy/utils')

module.exports = {
  type: 'post',
  tags: 'articles',
  layout: 'layouts/articles/item',
  eleventyComputed: {
    /** Metadata for JSON-LD schema generator plugin */
    type: 'post',
    meta: function (data) {
      return this.postSchema(data)
    },
    cover: data => {
      return getCoverImageFilePath(data) // returns relative path
    },
    permalink: data => {
      return getPermalinkPath(data) // returns absolute path
    },
  },
  featured: false,
}
