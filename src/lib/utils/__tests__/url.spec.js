const { describe, expect, test } = require('@jest/globals')
const { getBaseURL, getDomain } = require('../url')

const env = process.env.ELEVENTY_ENV ?? 'production'
const subdomain = process.env.ELEVENTY_SUBDOMAIN
const devServerPort = process.env.ELEVENTY_DEV_SERVER_PORT ?? 8081
const testingServerPort = process.env.ELEVENTY_TESTING_SERVER_PORT ?? 52837

beforeAll(() => {
  process.env.ELEVENTY_ENV = env
  process.env.ELEVENTY_SUBDOMAIN = 'www'
  process.env.ELEVENTY_DEV_SERVER_PORT = devServerPort
  process.env.ELEVENTY_TESTING_SERVER_PORT = testingServerPort
})

jest.mock('../../../package.json', () => ({
  domain: 'example.com',
}))

describe(`Gets the domain key from package.json`, () => {


  test(`Returns domain if it's set in package.json`, () => {
    expect(getDomain()).toMatch(/example\.com/)
  })
})

describe(`Gets the correct base URL based on enviromnent`, () => {
  afterEach(() => {
    process.env.ELEVENTY_ENV = env
    process.env.ELEVENTY_DEV_SERVER_PORT = devServerPort
    process.env.ELEVENTY_TESTING_SERVER_PORT = testingServerPort
  })

  test(`Returns correct base URL for production`, () => {
    expect(getBaseURL()).toMatch(/https:\/\/www\.example\.com/)
  })

  test(`Builds base path with subdomain key in .env.local correctly`, () => {
    delete process.env.ELEVENTY_SUBDOMAIN
    expect(getBaseURL()).toMatch(/https:\/\/example\.com/)
    process.env.ELEVENTY_SUBDOMAIN = subdomain
  })

  test(`Throws if ELEVENTY_DEV_SERVER_PORT env var isn't set`, () => {
    delete process.env.ELEVENTY_DEV_SERVER_PORT
    expect(() => getBaseURL()).toThrowError()
  })

  test(`Gets the correct dev server URL based on enviromnent`, () => {
    process.env.ELEVENTY_ENV = 'development'
    expect(getBaseURL()).toMatch(/http:\/\/localhost:8081/)
  })

  test(`Throws if ELEVENTY_TESTING_SERVER_PORT env var isn't set`, () => {
    delete process.env.ELEVENTY_TESTING_SERVER_PORT
    expect(() => getBaseURL()).toThrowError()
  })

  test(`Gets the correct testing URL based on enviromnent`, () => {
    process.env.ELEVENTY_ENV = 'testing'
    expect(getBaseURL()).toMatch(/http:\/\/localhost:52837/)
  })
})
