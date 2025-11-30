import { describe, expect, it } from 'vitest'
import * as headServer from '../index'

describe('getSocialImage', () => {
  it('encodes parameters and strips trailing slashes from base URL', () => {
    const url = headServer.getSocialImage(
      'https://example.com/',
      'Launch Announcement',
      'See what is new!',
      'news/update'
    )

    expect(url).toBe(
      'https://example.com/api/social-card?title=Launch%20Announcement&description=See%20what%20is%20new!&slug=news%2Fupdate&format=html'
    )
  })

  it('falls back to default values when inputs are missing', () => {
    const url = headServer.getSocialImage('https://webstackbuilders.com')

    expect(url).toBe(
      'https://webstackbuilders.com/api/social-card?title=Webstack%20Builders&description=Professional%20Web%20Development%20Services&slug=home&format=html'
    )
  })
})

describe('getSocialMetadata', () => {
  it('generates metadata from normalized base URL when no image is provided', () => {
    const metadata = headServer.getSocialMetadata({
      title: 'Custom Title',
      description: 'Custom Description',
      slug: 'launch/post',
      baseUrl: 'https://example.com/',
    })

    expect(metadata.ogImage).toBe(
      'https://example.com/api/social-card?title=Custom%20Title&description=Custom%20Description&slug=launch%2Fpost&format=html'
    )
    expect(metadata.ogUrl).toBe('https://example.com/launch/post')
  })

  it('prefers the provided image and URL overrides', () => {
    const metadata = headServer.getSocialMetadata({
      title: 'Provided Image',
      description: 'Provided Description',
      slug: 'ignored',
      image: 'https://cdn.example.com/card.png',
      url: 'https://example.com/custom',
      baseUrl: 'https://example.com/',
    })

    expect(metadata.ogImage).toBe('https://cdn.example.com/card.png')
    expect(metadata.ogUrl).toBe('https://example.com/custom')
    expect(metadata.twitterImage).toBe('https://cdn.example.com/card.png')
  })
})
