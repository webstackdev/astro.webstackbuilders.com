/**
 * Data computed at end of data cascade and available to all pages
 */

module.exports = {
  eleventyComputed: {
    /** Metadata for JSON-LD schema generator plugin */
    type: 'page',
    meta: function (data) {
      return this.pageSchema(data)
    },
  },
}
