const { normalizeTagName } = require('./normalizeTagName')

/**
 * Wrap a key with an anchor element if there is a tag collection for the key
 *
 * @param {Array} allCollections The collections.all object passed in the shortcode
 * @param {string} key The key to conditionally render with a link
 * @returns {string} The conditionally rendered tag name
 *
 * Usage:
 * {% conditionalTagLink collections.all cms %}
 */
export const conditionalTagLink = (allCollections, key) => {
  if (typeof key !== 'string')
    throw new Error(
      `Key passed to Nunjucks conditionalTagLink shortcode is not a string, received:\n${key}`
    )
  if (allCollections.find(item => item.data.tags.includes(key))) {
    return `<a href="/tags/${key}/">${normalizeTagName(key)}</a>`
  }
  return normalizeTagName(key)
}
