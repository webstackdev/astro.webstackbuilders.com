// @vitest-environment node
import { beforeEach, describe, expect, test } from 'vitest'
import { Window } from 'happy-dom'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { SELECTORS, getNewsletterElements } from '@components/CallToAction/Newsletter/client/selectors'
import NewsletterFixture from '@components/CallToAction/Newsletter/client/__fixtures__/index.fixture.astro'

const getRootElement = (win: Window): Element => {
  const root = win.document.querySelector('newsletter-form')
  if (!root) {
    throw new Error('Failed to find <newsletter-form> root in selectors.spec.ts')
  }
  return root as unknown as Element
}

describe('Newsletter selector utilities', () => {
  let container: AstroContainer
  let windowInstance: Window

  beforeEach(async () => {
    container = await AstroContainer.create()
    const html = await container.renderToString(NewsletterFixture)
    windowInstance = new Window()
    windowInstance.document.body.innerHTML = html

    Object.assign(globalThis, {
      Node: windowInstance.Node,
      Element: windowInstance.Element,
      HTMLElement: windowInstance.HTMLElement,
      HTMLFormElement: windowInstance.HTMLFormElement,
      HTMLInputElement: windowInstance.HTMLInputElement,
      HTMLButtonElement: windowInstance.HTMLButtonElement,
      HTMLSpanElement: windowInstance.HTMLSpanElement,
      HTMLParagraphElement: windowInstance.HTMLParagraphElement,
      SVGElement: windowInstance.SVGElement,
      SVGSVGElement: windowInstance.SVGSVGElement,
    })
  })

  test('returns every required element from the rendered fixture', () => {
    const elements = getNewsletterElements(getRootElement(windowInstance))

    expect(elements.form).toBeInstanceOf(HTMLFormElement)
    expect(elements.emailInput).toBeInstanceOf(HTMLInputElement)
    expect(elements.consentCheckbox).toBeInstanceOf(HTMLInputElement)
    expect(elements.submitButton).toBeInstanceOf(HTMLButtonElement)
    expect(elements.buttonText).toBeInstanceOf(HTMLSpanElement)
    expect(elements.buttonArrow).toBeInstanceOf(SVGSVGElement)
    expect(elements.buttonSpinner).toBeInstanceOf(SVGSVGElement)
    expect(elements.message).toBeInstanceOf(HTMLParagraphElement)
  })

  test('throws ClientScriptError when a required selector is missing', () => {
    const root = getRootElement(windowInstance)
    root.querySelector(SELECTORS.emailInput)?.remove()

    expect(() => getNewsletterElements(root)).toThrowError('Email input element not found')
  })
})
