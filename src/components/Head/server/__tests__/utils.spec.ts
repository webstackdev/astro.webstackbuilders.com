import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSocialImageLink } from '../utils'
import { getSiteUrl } from '@lib/config/siteUrlServer'

vi.mock('@lib/config/siteUrlServer', () => ({
  getSiteUrl: vi.fn(() => 'https://site.test'),
}))

const mockedGetSiteUrl = vi.mocked(getSiteUrl)

describe('getSocialImageLink', () => {
  beforeEach(() => {
    mockedGetSiteUrl.mockClear()
    mockedGetSiteUrl.mockReturnValue('https://site.test')
  })

  it('falls back to the home slug when no usable path is provided', () => {
      expect(getSocialImageLink()).toBe('https://site.test/api/social-card?slug=home')
      expect(getSocialImageLink('   ')).toBe('https://site.test/api/social-card?slug=home')
    expect(mockedGetSiteUrl).toHaveBeenCalledTimes(2)
  })

  it('normalizes relative paths with redundant separators and whitespace', () => {
    const url = getSocialImageLink('  /Articles//My  Feature / ')
      expect(url).toBe('https://site.test/api/social-card?slug=Articles%2FMy-Feature')
  })

  it('parses absolute URLs and decodes their path segments', () => {
    const url = getSocialImageLink('https://preview.example.com/services/Launch%20Plan///?src=home')
      expect(url).toBe('https://site.test/api/social-card?slug=services%2FLaunch-Plan')
  })

  it('uses the site url value returned at call time', () => {
    mockedGetSiteUrl.mockReturnValueOnce('https://custom.test')
    const url = getSocialImageLink('about/company')
      expect(url).toBe('https://custom.test/api/social-card?slug=about%2Fcompany')
    expect(mockedGetSiteUrl).toHaveBeenCalledTimes(1)
  })
})
