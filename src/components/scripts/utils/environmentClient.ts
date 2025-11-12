/**
 * Client-side checks for environment
 */

// @TODO: Implement these methods

export const getSiteUrl = () => {
  return "localhost:4321"
}

export const isCI = () => {
  return true
}

// Vitest sets the VITEST environment variable and exposes them from your .env files as import.meta.env.
export const isUnitTest = () => {
  return true
}

export const isDev = () => {
  return true
}

export const isProd = () => {
  return true
}
