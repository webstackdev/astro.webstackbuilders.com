// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import CheckboxFixture from '@components/Consent/Checkbox/client/__tests__/checkbox.fixture.astro'
import {
  getConsentCheckbox,
  getConsentContainer,
  getConsentDescription,
  getConsentError,
} from '@components/Consent/Checkbox/client/selectors'
import type { ConsentCheckboxElement } from '@components/Consent/Checkbox/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { ClientScriptError } from '@components/scripts/errors'

type ConsentCheckboxModule = WebComponentModule<ConsentCheckboxElement>

const defaultProps = {
  id: 'gdpr-consent',
  purpose: 'Responding to your inquiry',
}

const CONSENT_READY_TIMEOUT_MS = 2_000

const waitForConsentReady = async (element: ConsentCheckboxElement) => {
  await new Promise<void>((resolve, reject) => {
    if (element.isInitialized) {
      resolve()
      return
    }

    const timeoutId = setTimeout(() => {
      element.removeEventListener('consent-checkbox:ready', onReady)
      reject(new Error('Consent checkbox never finished initializing'))
    }, CONSENT_READY_TIMEOUT_MS)

    function onReady() {
      clearTimeout(timeoutId)
      resolve()
    }

    element.addEventListener('consent-checkbox:ready', onReady, { once: true })
  })
}

const renderSelectors = async (
  assertion: (_context: { element: ConsentCheckboxElement }) => Promise<void> | void,
  props: Record<string, unknown> = {},
) => {
  const container = await AstroContainer.create()

  await executeRender<ConsentCheckboxModule>({
    container,
    component: CheckboxFixture,
    moduleSpecifier: '@components/Consent/Checkbox/client/index',
    args: { props: { ...defaultProps, ...props } },
    selector: 'consent-checkbox',
    waitForReady: waitForConsentReady,
    assert: async ({ element }) => assertion({ element }),
  })
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
