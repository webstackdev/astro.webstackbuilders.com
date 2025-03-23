/* eslint-disable jsdoc/check-indentation */
/**
 * Print high numbers like '11K' for thousands. Usage:
 * {{ likeCount | humanizeNumber }}
 *
 * @param {undefined} _ curried EleventyConfig object
 * @param {number} num number to humanize
 * @returns {string} number formatted to be human readable
 */
exports.humanizeNumber = (_, num) => {
  if (num > 999) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return num
}

/**
 * Usage:
 * <a href="mailto:{{ author.email | obfuscate | safe }}">
 *   {{ author.email | obfuscate | safe }}
 * </a>
 *
 * @param {undefined} _ curried EleventyConfig object
 * @param {string} str the email string to be obfuscated
 * @returns {string} obfuscated email address
 */
exports.obfuscate = (_, str) => {
  const chars = []
  for (var i = str.length - 1; i >= 0; i--) {
    // eslint-disable-next-line security/detect-object-injection
    chars.unshift(['&#', str[i].charCodeAt(), ';'].join(''))
  }
  return chars.join('')
}

/**
 * Sets or changes the extension on media files. Usage:
 *   {{ imgsrc | setExt('webp') }}
 *
 * @param {undefined} _ curried EleventyConfig object
 * @param {string} path full path to the media file
 * @param {string} extension the new file extension to set the media file to
 * @returns {string} the modified file path
 */
exports.setExt = (_, path, extension) => {
  if (!extension) return path
  return path.substr(0, path.lastIndexOf('.')) + `.${extension}`
}
