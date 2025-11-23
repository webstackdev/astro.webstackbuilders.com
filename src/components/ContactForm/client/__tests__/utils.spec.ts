// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { initCharacterCounter, initUploadPlaceholder } from '@components/ContactForm/client/utils'
import type { ContactFormConfig, ContactFormElements } from '@components/ContactForm/client/@types'

const baseConfig: ContactFormConfig = {
  maxCharacters: 2000,
  warningThreshold: 1500,
  errorThreshold: 1800,
  apiEndpoint: '/api/contact',
}

const createElements = () => ({
  messageTextarea: document.createElement('textarea'),
  charCount: document.createElement('span'),
  uppyContainer: document.createElement('div'),
} as Pick<ContactFormElements, 'messageTextarea' | 'charCount' | 'uppyContainer'> as ContactFormElements)

describe('ContactForm utils', () => {
  it('updates character counter colors across thresholds', () => {
    const elements = createElements()
    initCharacterCounter(elements, baseConfig)

    elements.messageTextarea.value = 'a'.repeat(100)
    elements.messageTextarea.dispatchEvent(new Event('input'))
    expect(elements.charCount.textContent).toBe('100')
    expect(elements.charCount.style.color).toBe('var(--color-text-offset)')

    elements.messageTextarea.value = 'a'.repeat(baseConfig.warningThreshold + 1)
    elements.messageTextarea.dispatchEvent(new Event('input'))
    expect(elements.charCount.style.color).toBe('var(--color-warning)')

    elements.messageTextarea.value = 'a'.repeat(baseConfig.errorThreshold + 1)
    elements.messageTextarea.dispatchEvent(new Event('input'))
    expect(elements.charCount.style.color).toBe('var(--color-danger)')
  })

  it('reveals upload placeholder only when container exists', () => {
    const elements = createElements()
    elements.uppyContainer.hidden = true

    initUploadPlaceholder(elements)
    expect(elements.uppyContainer.hidden).toBe(false)

    const withoutContainer = { ...elements, uppyContainer: null }
    expect(() => initUploadPlaceholder(withoutContainer as ContactFormElements)).not.toThrow()
  })
})
