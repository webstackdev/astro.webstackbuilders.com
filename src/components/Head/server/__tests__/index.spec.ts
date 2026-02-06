import { afterEach, describe, expect, it, vi } from 'vitest'
import * as siteUrlServer from '@lib/config/siteUrlServer'
import * as headServer from '../index'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getSocialImageLink', () => {
  const mockSiteUrl = () =>
    vi.spyOn(siteUrlServer, 'getSiteUrl').mockReturnValue('https://example.com')

  it('normalizes whitespace and slashes within the slug', () => {
    mockSiteUrl()
    const url = headServer.getSocialImageLink('  /articles//new-release/  ')

    expect(url).toBe('https://example.com/api/social-card?slug=articles%2Fnew-release')
  })

  it('derives the slug from an absolute URL and slugifies spaces', () => {
    mockSiteUrl()
    const url = headServer.getSocialImageLink(
      'https://www.webstackbuilders.com/services/cloud consulting/'
    )

    expect(url).toBe('https://example.com/api/social-card?slug=services%2Fcloud-consulting')
  })

  it('falls back to the default slug when path is missing', () => {
    mockSiteUrl()
    const url = headServer.getSocialImageLink(undefined)

    expect(url).toBe('https://example.com/api/social-card?slug=home')
  })
})
