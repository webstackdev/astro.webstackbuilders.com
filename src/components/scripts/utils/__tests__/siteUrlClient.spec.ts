// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getSiteUrl } from '@components/scripts/utils/siteUrlClient'

const isProdMock = vi.hoisted(() => vi.fn(() => false))
const isE2eTestMock = vi.hoisted(() => vi.fn(() => false))
const devPort = vi.hoisted(() => 5173)

vi.mock('@components/scripts/utils/environmentClient', () => ({
  isProd: isProdMock,
  isE2eTest: isE2eTestMock,
}))

vi.mock('astro:env/client', () => ({
  DEV_SERVER_PORT: devPort,
}))

describe('getSiteUrl', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.stubEnv('SITE', 'demo.webstackbuilders.com')
    isProdMock.mockReturnValue(false)
    isE2eTestMock.mockReturnValue(false)
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    vi.unstubAllEnvs()
  })

  it('returns the production domain when running outside E2E in prod', () => {
    isProdMock.mockReturnValue(true)

    const url = getSiteUrl()

    expect(url).toBe('https://www.webstackbuilders.com')
    expect(consoleSpy).not.toHaveBeenCalled()
  })

  it('falls back to localhost when running locally or during E2E', () => {
    isProdMock.mockReturnValue(true)
    isE2eTestMock.mockReturnValue(true)

    const url = getSiteUrl()

    expect(url).toBe(`http://localhost:${devPort}`)
    expect(consoleSpy).toHaveBeenCalledWith(`Using development environment on port ${devPort}.`)
  })
})
