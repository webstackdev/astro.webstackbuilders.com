import { describe, it, expect, vi, afterEach } from 'vitest'

const originalDevServerPort = process.env['DEV_SERVER_PORT']

// Reload the module with a fresh environment snapshot and mocked dependencies.
const importSiteUrlServer = async () => {
  vi.resetModules()
  const isVercelMock = vi.fn(() => false)
  vi.doMock('../environmentServer', () => ({
    isVercel: isVercelMock,
  }))
  vi.doMock('../../../../package.json', () => ({
    domain: 'webstackbuilders.com',
    default: { domain: 'webstackbuilders.com' },
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
})
