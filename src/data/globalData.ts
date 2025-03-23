const {
  author,
  lang,
  locale,
  organization,
  title,
  description,
  domain,
  email,
} = require('../../package.json')

const { getBaseURL } = require('../utils/url')

/**
 * Add site global data keys
 *
 * @returns {object} Keys with global data e.g. baseUrl, description, title
 */
exports.getSiteGlobalData = () => {
  return {
    author,
    baseUrl: getBaseURL(),
    description,
    domain,
    email,
    lang,
    locale,
    organization,
    title,
  }
}
