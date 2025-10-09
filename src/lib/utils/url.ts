/**
 * Determine appropriate base URL for the site so that links work
 * in both development (using localhost) and production environments.
 */
export const getDomain = () => {
  const { domain } = require('../../package.json')
  if (!domain) {
    throw new Error(`The 'domain' key should be set in the project's package.json file with the project's domain, e.g. example.com, so that links can be properly built.`)
  }
  const subdomain = process.env['ELEVENTY_SUBDOMAIN']
  const fullDomain = subdomain ? `${subdomain}.${domain}` : domain
  return fullDomain
}

export const getBaseURL = () => {
  if (!process.env['ELEVENTY_DEV_SERVER_PORT']) {
    throw new Error(
      `A value for ELEVENTY_DEV_SERVER_PORT, identifying the port for Eleventy's development server, should be set in the project's .env.local or other environmental variables file`
    )
  }

  if (!process.env['ELEVENTY_TESTING_SERVER_PORT']) {
    throw new Error(
      `A value for ELEVENTY_TESTING_SERVER_PORT, identifying the port for Playwright e2e testing, should be set in the project's .env.local or other environmental variables file`
    )
  }

  switch (process.env['ELEVENTY_ENV']) {
    case 'development':
      return `http://localhost:${process.env['ELEVENTY_DEV_SERVER_PORT']}`
    case 'testing':
      return `http://localhost:${process.env['ELEVENTY_TESTING_SERVER_PORT']}`
    default: // production
      return `https://${getDomain()}`
  }
}
