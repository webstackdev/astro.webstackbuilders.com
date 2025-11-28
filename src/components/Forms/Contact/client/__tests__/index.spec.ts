import { describe, it, expect, vi } from 'vitest'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('ContactForm web component module', () => {
  it('exposes metadata for registration', async () => {
    await withJsdomEnvironment(async () => {
      const { webComponentModule, ContactFormElement } = await import('@components/Forms/Contact/client')

      expect(webComponentModule.registeredName).toBe('contact-form')
      expect(webComponentModule.componentCtor).toBe(ContactFormElement)
    })
  })

  it('registers the custom element when window is available', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      const { registerContactFormWebComponent, ContactFormElement } = await import('@components/Forms/Contact/client')
      const uniqueTag = `contact-form-${Math.random().toString(36).slice(2)}`

      const originalGet = window.customElements.get.bind(window.customElements)
      const getSpy = vi.spyOn(window.customElements, 'get').mockImplementation((tagName: string) => {
        if (tagName === uniqueTag) {
          return undefined
        }
        return originalGet(tagName)
      })
      const defineSpy = vi.spyOn(window.customElements, 'define').mockImplementation(() => undefined)

      registerContactFormWebComponent(uniqueTag)

      expect(defineSpy).toHaveBeenCalledWith(uniqueTag, ContactFormElement)

      getSpy.mockRestore()
      defineSpy.mockRestore()
    })
  })
})
