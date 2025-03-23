/**
 * Filters to specify for use in .eleventy.js with `addFilter`
 *
 * Use the Configuration API 'getFilter' method to use a
 * filter inside of another filter or shortcode.
 *
 * Filters take a single input on the left, modify this inline and return a single value:
 *   {{ "mike" | upcase  }}
 */

/**
 * Gets the full data for the current page from collections using the page's path as a key
 */
const { currentPage } = require('./collections')
exports.currentPage = currentPage

/**
 * Usage:
 *   {{ build.timestamp | dateToFormat('yyyy') }}
 * Friday, July 15, 2022 at 11:39:50 PM GMT+3
 */
const { dateToFormat } = require('./date')
exports.dateToFormat = dateToFormat

/**
 * Usage:
 *   <time dateTime="{{ post.date | dateToISO }}">{ post.date | readableDate }</time>
 */
const { dateToISO } = require('./date')
exports.dateToISO = dateToISO

/**
 * Usage:
 *   {{ webmention.published | dateFromISO | readableDate("dd LLL yyyy") }}
 */
const { dateFromISO } = require('./date')
exports.dateFromISO = dateFromISO

/**
 * Example using Liquid templating engine:
 *   {% assign taggers = tip.data.tags | exclude: "tips" %}
 */
const { exclude } = require('./collections')
exports.exclude = exclude

/**
 * Usage:
 *   {% set otherposts = collections.posts | excludeItemFromCollection(page) | slice(-10) %}
 */
const { excludeItemFromCollection } = require('./collections')
exports.excludeItemFromCollection = excludeItemFromCollection

/**
 * Find item in associative array by key. Usage:
 *   {%- set dark = themes|findById('dark') -%}
 */
const { findById } = require('./collections')
exports.findById = findById

/**
 * Print high numbers as "11K" for thousands. Usage:
 *   {{ likeCount | humanizeNumber }}
 */
const { humanizeNumber } = require('./format')
exports.humanizeNumber = humanizeNumber

/**
 * Identity filter for use in tests
 *
 * Usage:
 *   {{ `test` | identity }}
 */
const { identity } = require('./identity')
exports.identity = identity

/**
 * Usage:
 *   <a href="mailto:{{ author.email | obfuscate | safe }}">
 *     {{ author.email | obfuscate | safe }}
 *   </a>
 */
const { obfuscate } = require('./format')
exports.obfuscate = obfuscate

/**
 * Friendly date filter. Supported tokens:
 * https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens
 * Usage:
 *   {{ date | readableDate('dd LLL yyyy') }}
 */
const { readableDate } = require('./date')
exports.readableDate = readableDate

/**
 * Sets or changes the extension on media files. Usage:
 *   {{ imgsrc | setExt('webp') }}
 */
const { setExt } = require('./format')
exports.setExt = setExt

/**
 * Usage:
 *   {% set otherposts = collections.posts | excludePost(page) | slice(-10) %}
 */
const { slice } = require('./collections')
exports.slice = slice

/**
 * Example using Liquid templating engine:
 *   {% assign category = collections.categories | withCategory: "articles" %}
 */
const { withCategory } = require('./collections')
exports.withCategory = withCategory
