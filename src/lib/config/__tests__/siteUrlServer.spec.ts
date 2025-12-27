import { describe, it, expect, vi, afterEach } from 'vitest'

const originalDevServerPort = process.env['DEV_SERVER_PORT']

// Reload the module with a fresh environment snapshot and mocked dependencies.
const importSiteUrlServer = async () => {
  vi.resetModules()
  const isVercelMock = vi.fn(() => false)
  const isGitHubMock = vi.fn(() => false)
  vi.doMock('../environmentServer', async importOriginal => {
    const actual = await importOriginal<typeof import('../environmentServer')>()
    return {
      ...actual,
      isVercel: isVercelMock,
      isGitHub: isGitHubMock,
    }
  })
  const module = await import('../siteUrlServer')
  return { getSiteUrl: module.getSiteUrl, isVercelMock, isGitHubMock }
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
  it('throws a BuildError when running on Vercel', async () => {
    const { getSiteUrl, isVercelMock, isGitHubMock } = await importSiteUrlServer()
    const { BuildError } = await import('../../errors/BuildError')
    isVercelMock.mockReturnValue(true)
    isGitHubMock.mockReturnValue(false)

    const invokeGetSiteUrl = () => getSiteUrl()
    expect(invokeGetSiteUrl).toThrowError(BuildError)
    expect(invokeGetSiteUrl).toThrowError(
      '❌ Build runs on GitHub, so this build-time getSiteUrl() function should never be called on Vercel.'
    )
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
