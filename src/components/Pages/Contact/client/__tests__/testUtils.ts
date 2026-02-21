import { expect } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { TestError } from '@test/errors'
import ContactFormFixture from '@components/Pages/Contact/client/__fixtures__/contactForm.fixture.astro'
import type { ContactFormElement } from '@components/Pages/Contact/client'
import { getContactFormElements } from '@components/Pages/Contact/client/selectors'
import type { ContactFormElements } from '@components/Pages/Contact/client/@types'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

export type ContactFormModule = WebComponentModule<ContactFormElement>

export interface RenderContactFormContext {
  element: ContactFormElement
  window: Window & typeof globalThis
  module: ContactFormModule
  elements: ContactFormElements
}

export type RenderContactFormAssertion = (
  _context: RenderContactFormContext
) => Promise<void> | void

export const renderContactForm = async (assertion: RenderContactFormAssertion): Promise<void> => {
  const container = await AstroContainer.create()

  await executeRender<ContactFormModule>({
    container,
    component: ContactFormFixture,
    moduleSpecifier: '@components/Pages/Contact/client/index',
    selector: 'contact-form',
    assert: async ({ element, module, window, renderResult }) => {
      if (!window) {
        throw new TestError('Contact form tests require a DOM-like window environment')
      }

      const context = {
        element,
        module,
        window: window as Window & typeof globalThis,
        elements: getContactFormElements(),
      }

      expect(renderResult).toContain(`<${module.registeredName}`)
      await assertion(context)
    },
  })
}
