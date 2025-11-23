// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Window } from 'happy-dom'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ContactForm from '@components/ContactForm/index.astro'
import { getContactFormElements } from '@components/Forms/Contact/client/selectors'

const attachDocumentToGlobal = (windowInstance: Window) => {
  const runtime = globalThis as typeof globalThis
  const runtimeRecord = runtime as unknown as Record<string, unknown>
  const domKeys = [
    'window',
    'document',
    'Node',
    'Element',
    'HTMLElement',
    'HTMLFormElement',
    'HTMLInputElement',
    'HTMLTextAreaElement',
    'HTMLButtonElement',
    'HTMLLabelElement',
  ] as const

  const values: Record<(typeof domKeys)[number], unknown> = {
    window: windowInstance,
    document: windowInstance.document,
    Node: windowInstance.Node,
    Element: windowInstance.Element,
    HTMLElement: windowInstance.HTMLElement,
    HTMLFormElement: windowInstance.HTMLFormElement,
    HTMLInputElement: windowInstance.HTMLInputElement,
    HTMLTextAreaElement: windowInstance.HTMLTextAreaElement,
    HTMLButtonElement: windowInstance.HTMLButtonElement,
    HTMLLabelElement: windowInstance.HTMLLabelElement,
  }

  const previousState = new Map<string, { hadOwn: boolean; value: unknown }>()

  domKeys.forEach(key => {
    previousState.set(key, {
      hadOwn: Object.prototype.hasOwnProperty.call(runtimeRecord, key),
      value: runtimeRecord[key],
    })
    runtimeRecord[key] = values[key]
  })

  return () => {
    domKeys.forEach(key => {
      const previous = previousState.get(key)
      if (previous?.hadOwn) {
        runtimeRecord[key] = previous.value
      } else {
        Reflect.deleteProperty(runtimeRecord, key)
      }
    })
  }
}

describe('ContactForm selectors', () => {
  let container: AstroContainer
  let restoreGlobals: (() => void) | undefined

  beforeEach(async () => {
    container = await AstroContainer.create()
    restoreGlobals = undefined
  })

  afterEach(() => {
    if (restoreGlobals) {
      restoreGlobals()
      restoreGlobals = undefined
    }
  })

  it('collects all required form elements from rendered ContactForm', async () => {
    const html = await container.renderToString(ContactForm)
    const windowInstance = new Window()

    windowInstance.document.write(html)
    windowInstance.document.close()

    restoreGlobals = attachDocumentToGlobal(windowInstance)

    const elements = getContactFormElements()

    expect(elements.form.id).toBe('contactForm')
    expect(elements.fields.name.input.id).toBe('name')
    expect(elements.fields.email.input.id).toBe('email')
    expect(elements.fields.message.input.id).toBe('message')
    expect(elements.fields.name.feedback.dataset['fieldError']).toBe('name')
    expect(elements.fields.email.feedback.dataset['fieldError']).toBe('email')
    expect(elements.fields.message.feedback.dataset['fieldError']).toBe('message')

    expect(elements.formErrorBanner.id).toBe('formErrorBanner')
    expect(elements.successMessage.classList.contains('message-success')).toBe(true)
    expect(elements.errorMessage.classList.contains('message-error')).toBe(true)
    expect(elements.charCount.id).toBe('charCount')
    expect(elements.submitBtn.id).toBe('submitBtn')
    expect(elements.btnText.classList.contains('btn-text')).toBe(true)
    expect(elements.btnLoading.classList.contains('btn-loading')).toBe(true)
  })
})
