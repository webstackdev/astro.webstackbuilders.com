
import { describe, expect, it } from 'vitest'
import {
  getConsentCheckbox,
  getConsentContainer,
  getConsentDescription,
  getConsentError,
} from '@components/Consent/Checkbox/client/selectors'
import type { ConsentCheckboxElement } from '@components/Consent/Checkbox/client'
import { ClientScriptError } from '@components/scripts/errors'
import { renderConsentCheckbox } from '@components/Consent/Checkbox/client/__tests__/testUtils'

const renderSelectors = async (
  assertion: (_context: { element: ConsentCheckboxElement }) => Promise<void> | void,
  props: Record<string, unknown> = {},
) => {
  await renderConsentCheckbox(async ({ element }) => {
    await assertion({ element })
  }, props)
}

describe('Consent checkbox selectors', () => {
  it('locates the default checkbox, container, description, and error nodes', async () => {
    await renderSelectors(() => {
      const checkbox = getConsentCheckbox()
      const container = getConsentContainer()
      const description = getConsentDescription()
      const error = getConsentError()

      expect(checkbox).toBeInstanceOf(HTMLInputElement)
      expect(container).toBeInstanceOf(HTMLDivElement)
      expect(description).toBeInstanceOf(HTMLSpanElement)
      expect(error).toBeInstanceOf(HTMLDivElement)
      expect(container.contains(checkbox)).toBe(true)
      expect(container.contains(description)).toBe(true)
      expect(container.contains(error)).toBe(true)
    })
  })

  it('supports custom checkbox identifiers', async () => {
    await renderSelectors(() => {
      const checkbox = getConsentCheckbox('newsletter-consent')
      const container = getConsentContainer('newsletter-consent')
      const error = getConsentError('newsletter-consent')
      const description = getConsentDescription('newsletter-consent')

      expect(checkbox.id).toBe('newsletter-consent')
      expect(container.id).toBe('newsletter-consent-container')
      expect(error.id).toBe('newsletter-consent-error')
      expect(description.id).toBe('newsletter-consent-description')
    }, { id: 'newsletter-consent' })
  })

  it('throws ClientScriptError when required nodes are missing', async () => {
    await renderSelectors(() => {
      document.getElementById('gdpr-consent')?.remove()
      expect(() => getConsentCheckbox()).toThrow(ClientScriptError)

      document.getElementById('gdpr-consent-error')?.remove()
      expect(() => getConsentError()).toThrow(ClientScriptError)

      document.getElementById('gdpr-consent-description')?.remove()
      expect(() => getConsentDescription()).toThrow(ClientScriptError)

      document.getElementById('gdpr-consent-container')?.remove()
      expect(() => getConsentContainer()).toThrow(ClientScriptError)
    })
  })
})
