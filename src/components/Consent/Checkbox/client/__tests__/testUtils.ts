import { expect } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { TestError } from '@test/errors'
import CheckboxFixture from '@components/Consent/Checkbox/client/__fixtures__/checkbox.fixture.astro'
import type { CheckboxFixtureProps } from '@components/Consent/Checkbox/client/types'
import type { ConsentCheckboxElement } from '@components/Consent/Checkbox/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

export type ConsentCheckboxModule = WebComponentModule<ConsentCheckboxElement>

const CONSENT_READY_TIMEOUT_MS = 2_000

export const consentCheckboxReadyEvent = 'consent-checkbox:ready'

export const waitForConsentReady = async (element: ConsentCheckboxElement): Promise<void> => {
  if (element.isInitialized) {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      element.removeEventListener(consentCheckboxReadyEvent, onReady)
      reject(new TestError('Consent checkbox never finished initializing'))
    }, CONSENT_READY_TIMEOUT_MS)

    function onReady() {
      clearTimeout(timeoutId)
      resolve()
    }

    element.addEventListener(consentCheckboxReadyEvent, onReady, { once: true })
  })
}

const defaultProps: CheckboxFixtureProps = {
  id: 'gdpr-consent',
  formId: 'contact-form',
  purpose: 'Responding to your inquiry',
  variant: 'default',
  wrapInForm: true,
}

export interface RenderConsentCheckboxContext {
  element: ConsentCheckboxElement
  window: Window & typeof globalThis
  module: ConsentCheckboxModule
}

export type RenderConsentCheckboxAssertion = (
  _context: RenderConsentCheckboxContext
) => Promise<void> | void

export const renderConsentCheckbox = async (
  assertion: RenderConsentCheckboxAssertion,
  props: Partial<CheckboxFixtureProps> = {}
): Promise<void> => {
  const container = await AstroContainer.create()

  await executeRender<ConsentCheckboxModule>({
    container,
    component: CheckboxFixture,
    moduleSpecifier: '@components/Consent/Checkbox/client/index',
    args: { props: { ...defaultProps, ...props } },
    selector: 'consent-checkbox',
    waitForReady: async (element: ConsentCheckboxElement) => {
      await waitForConsentReady(element)
      await element.updateComplete
    },
    assert: async ({ element, window, module, renderResult }) => {
      if (!window) {
        throw new TestError('Consent checkbox tests require a browser-like window environment')
      }

      expect(renderResult).toContain(`<${module.registeredName}`)
      await assertion({ element, window: window as Window & typeof globalThis, module })
    },
  })
}
