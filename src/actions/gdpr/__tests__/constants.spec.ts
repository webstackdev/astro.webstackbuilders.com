import { describe, expect, it } from 'vitest'

import { CONSENT_PURPOSES, CONSENT_SOURCES } from '../constants'

describe('gdpr constants', () => {
  it('exposes expected consent purposes', () => {
    expect(CONSENT_PURPOSES).toContain('contact')
    expect(CONSENT_PURPOSES).toContain('downloads')
  })

  it('exposes expected consent sources', () => {
    expect(CONSENT_SOURCES).toContain('cookies_modal')
    expect(CONSENT_SOURCES).toContain('preferences_page')
  })
})
