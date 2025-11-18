// @vitest-environment happy-dom
/**
 * Unit tests for Mastodon instances state management
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { $mastodonInstances, saveMastodonInstance } from '@components/scripts/store/mastodonInstances'
import { $consent, updateConsent } from '@components/scripts/store/consent'

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

describe('Mastodon Instance Management', () => {
  beforeEach(() => {
    // Reset stores to default state
    $consent.set({
      analytics: false,
      marketing: false,
      functional: false,
      DataSubjectId: '',
    })
    $mastodonInstances.set(new Set())

    // Clear mocks
    vi.clearAllMocks()

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should save instance when functional consent is granted', () => {
    updateConsent('functional', true)

    saveMastodonInstance('mastodon.social')

    const instances = $mastodonInstances.get()
    expect(instances.has('mastodon.social')).toBe(true)
  })

  it('should not save instance when functional consent is denied', () => {
    updateConsent('functional', false)

    saveMastodonInstance('mastodon.social')

    const instances = $mastodonInstances.get()
    expect(instances.size).toBe(0)
  })

  it('should maintain max 5 instances (FIFO)', () => {
    updateConsent('functional', true)

    // Add 6 instances
    saveMastodonInstance('instance1.com')
    saveMastodonInstance('instance2.com')
    saveMastodonInstance('instance3.com')
    saveMastodonInstance('instance4.com')
    saveMastodonInstance('instance5.com')
    saveMastodonInstance('instance6.com')

    const instances = $mastodonInstances.get()
    expect(instances.size).toBe(5)
    expect(instances.has('instance6.com')).toBe(true) // Most recent
    expect(instances.has('instance1.com')).toBe(false) // Oldest removed
  })

  it('should place most recent instance first', () => {
    updateConsent('functional', true)

    saveMastodonInstance('first.com')
    saveMastodonInstance('second.com')

    const instances = [...$mastodonInstances.get()]
    expect(instances[0]).toBe('second.com')
    expect(instances[1]).toBe('first.com')
  })
})
