// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  $emailCollection,
  __resetEmailCollectionForTests,
  clearCollectedEmail,
  getEmailCollectionSnapshot,
  markEmailCollected,
  subscribeToEmailCollection,
} from '../emailCollection'

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: vi.fn(),
}))

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  __resetEmailCollectionForTests()
})

describe('Email collection state management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    __resetEmailCollectionForTests()
  })

  it('defaults to no email collected', () => {
    const state = getEmailCollectionSnapshot()
    expect(state.hasProvidedEmail).toBe(false)
    expect(state.email).toBe('')
    expect(state.source).toBe('')
    expect(state.collectedAt).toBe('')
  })

  it('records an email from a newsletter form', () => {
    markEmailCollected('test@example.com', 'newsletter_form')

    const state = getEmailCollectionSnapshot()
    expect(state.hasProvidedEmail).toBe(true)
    expect(state.email).toBe('test@example.com')
    expect(state.source).toBe('newsletter_form')
    expect(state.collectedAt).toBeTruthy()
  })

  it('records an email from a download form', () => {
    markEmailCollected('dl@example.com', 'download_form')

    const state = getEmailCollectionSnapshot()
    expect(state.hasProvidedEmail).toBe(true)
    expect(state.email).toBe('dl@example.com')
    expect(state.source).toBe('download_form')
  })

  it('records an email from a contact form', () => {
    markEmailCollected('contact@example.com', 'contact_form')

    const state = getEmailCollectionSnapshot()
    expect(state.hasProvidedEmail).toBe(true)
    expect(state.email).toBe('contact@example.com')
    expect(state.source).toBe('contact_form')
  })

  it('clears collected email', () => {
    markEmailCollected('test@example.com', 'newsletter_form')
    clearCollectedEmail()

    const state = getEmailCollectionSnapshot()
    expect(state.hasProvidedEmail).toBe(false)
    expect(state.email).toBe('')
    expect(state.source).toBe('')
    expect(state.collectedAt).toBe('')
  })

  it('overwrites a previous email collection', () => {
    markEmailCollected('first@example.com', 'newsletter_form')
    markEmailCollected('second@example.com', 'download_form')

    const state = getEmailCollectionSnapshot()
    expect(state.email).toBe('second@example.com')
    expect(state.source).toBe('download_form')
  })

  it('notifies subscribers on change', () => {
    const callback = vi.fn()
    const unsubscribe = subscribeToEmailCollection(callback)

    // subscribe fires immediately with the current value
    callback.mockClear()

    markEmailCollected('sub@example.com', 'contact_form')

    expect(callback).toHaveBeenCalled()
    const [newValue] = callback.mock.calls[0]!
    expect(newValue).toMatchObject({
      hasProvidedEmail: true,
      email: 'sub@example.com',
    })

    unsubscribe()
  })

  it('persists state to localStorage', () => {
    markEmailCollected('persist@example.com', 'newsletter_form')

    const raw = localStorage.getItem('emailCollection')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.email).toBe('persist@example.com')
  })
})
