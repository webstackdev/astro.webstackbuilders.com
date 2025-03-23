/**
 * Get the year as a four-digit number
 * Usage: {% year true %}
 *
 * @param {object} _ Config object curried by loading script in .eleventy.js
 * @param {object} __ 11ty shortcodes stupidly error if called without params
 * @returns {string} The full year in numeric format, e.g. 1969
 */
exports.year = (_, __) => {
  const date = new Date()
  return date.getFullYear()
}
