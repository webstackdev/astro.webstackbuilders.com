import { describe, it, expect } from 'vitest'
import { TestError } from '@test/errors'
import { initCharacterCounter, initUploadPlaceholder } from '@components/Forms/Contact/client/utils'
import type { ContactFormConfig, ContactFormElements } from '@components/Forms/Contact/client/@types'
import { renderContactForm } from './testUtils'

const baseConfig: ContactFormConfig = {
  maxCharacters: 2000,
  warningThreshold: 1500,
  errorThreshold: 1800,
  apiEndpoint: '/api/contact',
}

describe('ContactForm utils', () => {
  it('updates character counter colors across thresholds', async () => {
    await renderContactForm(({ elements, window }) => {
      initCharacterCounter(elements, baseConfig)

      elements.messageTextarea.value = 'a'.repeat(100)
      elements.messageTextarea.dispatchEvent(new window.Event('input'))
      expect(elements.charCount.textContent).toBe('100')
      expect(elements.charCount.style.color).toBe('var(--color-text-offset)')

      elements.messageTextarea.value = 'a'.repeat(baseConfig.warningThreshold + 1)
      elements.messageTextarea.dispatchEvent(new window.Event('input'))
      expect(elements.charCount.style.color).toBe('var(--color-warning)')

      elements.messageTextarea.value = 'a'.repeat(baseConfig.errorThreshold + 1)
      elements.messageTextarea.dispatchEvent(new window.Event('input'))
      expect(elements.charCount.style.color).toBe('var(--color-danger)')
    })
  })

  it('reveals upload placeholder only when container exists', async () => {
    await renderContactForm(({ elements }) => {
      const { uppyContainer } = elements
      if (!uppyContainer) {
        throw new TestError('Contact form fixture must include the upload container')
      }

      uppyContainer.hidden = true

      initUploadPlaceholder(elements)
      expect(uppyContainer.hidden).toBe(false)

      const withoutContainer: ContactFormElements = { ...elements, uppyContainer: null }
      expect(() => initUploadPlaceholder(withoutContainer)).not.toThrow()
    })
  })
})
