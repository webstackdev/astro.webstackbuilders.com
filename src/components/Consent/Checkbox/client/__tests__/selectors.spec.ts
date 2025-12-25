
import { describe, expect, it } from 'vitest'
import {
  getConsentCheckboxErrorElement,
  getConsentCheckboxInput,
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
  it('locates the checkbox and error nodes within the component scope', async () => {
    await renderSelectors(({ element }) => {
      const checkbox = getConsentCheckboxInput(element)
      expect(checkbox, 'ConsentCheckbox should include a checkbox input').toBeInstanceOf(HTMLInputElement)
      expect(checkbox.id, 'ConsentCheckbox checkbox id should match default fixture id').toBe('gdpr-consent')

      const error = getConsentCheckboxErrorElement(element, checkbox.id)
      expect(error, 'ConsentCheckbox should include an error element for the checkbox').toBeInstanceOf(HTMLDivElement)
      expect(error.id, 'ConsentCheckbox error element id should be derived from checkbox id').toBe('gdpr-consent-error')
    })
  })

  it('throws ClientScriptError when required component-scoped nodes are missing', async () => {
    await renderSelectors(({ element }) => {
      element.querySelector('input[type="checkbox"]')?.remove()
      expect(() => getConsentCheckboxInput(element), 'getConsentCheckboxInput should throw when input is missing').toThrow(
        ClientScriptError,
      )
    })

    await renderSelectors(({ element }) => {
      element.querySelector('#gdpr-consent-error')?.remove()
      expect(
        () => getConsentCheckboxErrorElement(element, 'gdpr-consent'),
        'getConsentCheckboxErrorElement should throw when error element is missing',
      ).toThrow(ClientScriptError)
    })
  })

  it('locates the default checkbox, container, description, and error nodes', async () => {
    await renderSelectors(() => {
      const checkbox = getConsentCheckbox()
      const container = getConsentContainer()
      const description = getConsentDescription()
      const error = getConsentError()

      expect(checkbox, 'getConsentCheckbox should return the default input').toBeInstanceOf(HTMLInputElement)
      expect(container, 'getConsentContainer should return the default container div').toBeInstanceOf(HTMLDivElement)
      expect(description, 'getConsentDescription should return the default description span').toBeInstanceOf(
        HTMLSpanElement,
      )
      expect(error, 'getConsentError should return the default error div').toBeInstanceOf(HTMLDivElement)
      expect(container.contains(checkbox), 'Consent container should contain the checkbox input').toBe(true)
      expect(container.contains(description), 'Consent container should contain the description span').toBe(true)
      expect(container.contains(error), 'Consent container should contain the error element').toBe(true)
    })
  })

  it('supports custom checkbox identifiers', async () => {
    await renderSelectors(() => {
      const checkbox = getConsentCheckbox('newsletter-consent')
      const container = getConsentContainer('newsletter-consent')
      const error = getConsentError('newsletter-consent')
      const description = getConsentDescription('newsletter-consent')

      expect(checkbox.id, 'Custom consent checkbox id should be preserved').toBe('newsletter-consent')
      expect(container.id, 'Custom consent container id should be derived').toBe('newsletter-consent-container')
      expect(error.id, 'Custom consent error id should be derived').toBe('newsletter-consent-error')
      expect(description.id, 'Custom consent description id should be derived').toBe('newsletter-consent-description')
    }, { id: 'newsletter-consent' })
  })

  it('throws ClientScriptError when required nodes are missing', async () => {
    await renderSelectors(() => {
      document.getElementById('gdpr-consent')?.remove()
      expect(() => getConsentCheckbox(), 'getConsentCheckbox should throw when checkbox input is missing').toThrow(
        ClientScriptError,
      )

      document.getElementById('gdpr-consent-error')?.remove()
      expect(() => getConsentError(), 'getConsentError should throw when error element is missing').toThrow(
        ClientScriptError,
      )

      document.getElementById('gdpr-consent-description')?.remove()
      expect(() => getConsentDescription(), 'getConsentDescription should throw when description is missing').toThrow(
        ClientScriptError,
      )

      document.getElementById('gdpr-consent-container')?.remove()
      expect(() => getConsentContainer(), 'getConsentContainer should throw when container is missing').toThrow(
        ClientScriptError,
      )
    })
  })
})
