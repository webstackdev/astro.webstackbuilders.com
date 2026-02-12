import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Newsletter from '@components/CallToAction/Newsletter/index.astro'
import type { NewsletterProps } from '@components/CallToAction/Newsletter/client/@types'
import type { NewsletterFormElement } from '@components/CallToAction/Newsletter/client'
import {
  SELECTORS,
  getNewsletterElements,
} from '@components/CallToAction/Newsletter/client/selectors'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type NewsletterComponentModule = WebComponentModule<NewsletterFormElement>

const flushPromises = async () => {
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
}

const defaultNewsletterProps: NewsletterProps = {
  title: 'Selector Test Newsletter',
  description: 'Ensures selector utilities receive accurate markup',
  placeholder: 'user@example.com',
  buttonText: 'Subscribe',
  variant: 'article',
}

describe('Newsletter selector utilities', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const renderNewsletter = async (
    assertion: (_context: { element: NewsletterFormElement }) => Promise<void> | void,
    props: Partial<NewsletterProps> = {}
  ) => {
    await executeRender<NewsletterComponentModule>({
      container,
      component: Newsletter,
      moduleSpecifier: '@components/CallToAction/Newsletter/client/index',
      args: {
        props: {
          ...defaultNewsletterProps,
          ...props,
        },
      },
      waitForReady: async element => {
        element.initialize()
        await flushPromises()
      },
      assert: async ({ element }) => {
        await assertion({ element })
      },
    })
  }

  test('returns every required element from the rendered component', async () => {
    await renderNewsletter(async ({ element }) => {
      const elements = getNewsletterElements(element)

      expect(elements.form).toBeInstanceOf(HTMLFormElement)
      expect(elements.emailInput).toBeInstanceOf(HTMLInputElement)
      expect(elements.consentCheckbox).toBeInstanceOf(HTMLInputElement)
      expect(elements.submitButton).toBeInstanceOf(HTMLButtonElement)
      expect(elements.buttonText).toBeInstanceOf(HTMLSpanElement)
      expect(elements.buttonArrow).toBeInstanceOf(SVGSVGElement)
      expect(elements.buttonSpinner).toBeInstanceOf(SVGSVGElement)
      expect(elements.message).toBeInstanceOf(HTMLParagraphElement)
    })
  })

  test('throws ClientScriptError when a required selector is missing', async () => {
    await renderNewsletter(async ({ element }) => {
      element.querySelector(SELECTORS.emailInput)?.remove()

      expect(() => getNewsletterElements(element)).toThrowError('Email input element not found')
    })
  })
})
