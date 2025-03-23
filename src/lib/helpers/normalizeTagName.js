const { exceptions } = require('../../tags/tagList')

/**
 * Wrap a key with an anchor element if there is a tag collection for the key
 *
 * @param {object} _ Config object curried by loading script in .eleventy.js
 * @param {string} tag The tag name to normalize
 * @returns {string} The formatted page title
 *
 * Usage:
 * {% normalizeTagName "cms" %}
 */
function normalizeTagName(_, tag) {
  if (typeof tag !== 'string')
    throw new Error(
      `Key passed to Nunjucks normalizeTagName shortcode is not a string, received:\n${tag}`
    )
  if (tag in exceptions) return exceptions[tag]
  return tag.toUpperCase()
}

exports.normalizeTagName = normalizeTagName
