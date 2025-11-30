import { describe, it, expect, vi, afterEach } from 'vitest'

const originalDevServerPort = process.env['DEV_SERVER_PORT']

type ImportOptions = {
  domain?: string | undefined
}

// Reload the module with a fresh environment snapshot and mocked dependencies.
const importSiteUrlServer = async (options: ImportOptions = {}) => {
  const hasDomainOverride = Object.prototype.hasOwnProperty.call(options, 'domain')
  const domain = hasDomainOverride ? options.domain : 'webstackbuilders.com'
  vi.resetModules()
  const isVercelMock = vi.fn(() => false)
  vi.doMock('../environmentServer', () => ({
    isVercel: isVercelMock,
  }))
  vi.doMock('../../../../package.json', () => ({
    domain,
    default: { domain },
  }))
  const module = await import('../siteUrlServer')
  return { getSiteUrl: module.getSiteUrl, isVercelMock }
}

afterEach(() => {
  if (originalDevServerPort === undefined) {
    delete process.env['DEV_SERVER_PORT']
  } else {
    process.env['DEV_SERVER_PORT'] = originalDevServerPort
  }
  vi.restoreAllMocks()
})

describe('getSiteUrl', () => {
  it('returns the production domain when Vercel runtime is detected', async () => {
    const { getSiteUrl, isVercelMock } = await importSiteUrlServer()
    isVercelMock.mockReturnValue(true)
    expect(getSiteUrl()).toBe('https://webstackbuilders.com')
  })

  it('uses the provided DEV_SERVER_PORT when not running on Vercel', async () => {
    process.env['DEV_SERVER_PORT'] = '8888'
    const { getSiteUrl, isVercelMock } = await importSiteUrlServer()
    isVercelMock.mockReturnValue(false)
    expect(getSiteUrl()).toBe('http://localhost:8888')
  })

  it('falls back to the default localhost:4321 when DEV_SERVER_PORT is unset', async () => {
    delete process.env['DEV_SERVER_PORT']
    const { getSiteUrl, isVercelMock } = await importSiteUrlServer()
    isVercelMock.mockReturnValue(false)
    expect(getSiteUrl()).toBe('http://localhost:4321')
  })

  it('falls back to the default when DEV_SERVER_PORT is whitespace', async () => {
    process.env['DEV_SERVER_PORT'] = '   '
    const { getSiteUrl, isVercelMock } = await importSiteUrlServer()
    isVercelMock.mockReturnValue(false)
    expect(getSiteUrl()).toBe('http://localhost:4321')
  })

  it('throws a BuildError when running on Vercel without a configured domain', async () => {
    const { getSiteUrl, isVercelMock } = await importSiteUrlServer({ domain: undefined })
    const { BuildError } = await import('@lib/errors/BuildError')
    isVercelMock.mockReturnValue(true)

    const invokeGetSiteUrl = () => getSiteUrl()
    expect(invokeGetSiteUrl).toThrowError(BuildError)
    expect(invokeGetSiteUrl).toThrowError('Domain is required in package.json for Vercel production environment.')
  })
})
