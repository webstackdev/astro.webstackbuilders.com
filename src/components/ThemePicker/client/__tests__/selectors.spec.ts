// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ThemePickerFixture from '@components/ThemePicker/client/__fixtures__/client.fixture.astro'
import type { ThemePickerElement } from '@components/ThemePicker/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  getThemePickerCloseBtn,
  getThemePickerModal,
  getThemePickerToggleBtn,
  getThemeSelectBtns,
} from '@components/ThemePicker/client/selectors'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { ClientScriptError } from '@components/scripts/errors'

type ThemePickerModule = WebComponentModule<ThemePickerElement>

let container: AstroContainer

beforeAll(() => {
  Object.defineProperty(globalThis, 'CSS', {
    writable: true,
    value: {
      supports: () => true,
    },
  })
})

beforeEach(async () => {
  container = await AstroContainer.create()
})

const renderThemePickerDom = async (
  assertion: (_context: { element: ThemePickerElement }) => Promise<void> | void,
) => {
  await executeRender<ThemePickerModule>({
    container,
    component: ThemePickerFixture,
    moduleSpecifier: '@components/ThemePicker/client/index',
    selector: 'theme-picker',
    waitForReady: async (element) => {
      await element.updateComplete
    },
    assert: async ({ element }) => {
      await assertion({ element })
    },
  })
}

describe('ThemePicker selectors', () => {
  it('locates the modal element within the custom element scope', async () => {
    await renderThemePickerDom(({ element }) => {
      const modal = getThemePickerModal(element)

      expect(modal.hasAttribute('data-theme-modal')).toBe(true)
      expect(modal.dataset['themeModal']).toBe('')
    })
  })

  it('throws when the modal cannot be found', async () => {
    await renderThemePickerDom(({ element }) => {
      element.querySelector('[data-theme-modal]')?.remove()

      expect(() => getThemePickerModal(element)).toThrowError(ClientScriptError)
    })
  })

  it('finds the global toggle button rendered in the header', async () => {
    await renderThemePickerDom(() => {
      const toggleBtn = getThemePickerToggleBtn()

      expect(toggleBtn.classList.contains('theme-toggle-btn')).toBe(true)
      expect(toggleBtn.getAttribute('aria-label')).toMatch(/toggle theme switcher/i)
    })
  })

  it('throws when the toggle button is missing from the document', async () => {
    await renderThemePickerDom(() => {
      document.querySelector('[data-theme-toggle]')?.remove()

      expect(() => getThemePickerToggleBtn()).toThrowError(ClientScriptError)
    })
  })

  it('returns the close button scoped to the custom element', async () => {
    await renderThemePickerDom(({ element }) => {
      const closeBtn = getThemePickerCloseBtn(element)

      expect(closeBtn.matches('[data-theme-close]')).toBe(true)
      expect(closeBtn.getAttribute('aria-label')).toMatch(/close theme picker dialog/i)
    })
  })

  it('throws when no close button exists for the provided scope', async () => {
    await renderThemePickerDom(({ element }) => {
      element.querySelector('[data-theme-close]')?.remove()

      expect(() => getThemePickerCloseBtn(element)).toThrowError(ClientScriptError)
    })
  })

  it('returns the theme selection buttons as a NodeList', async () => {
    await renderThemePickerDom(({ element }) => {
      const buttons = getThemeSelectBtns(element)

      expect(buttons.length).toBeGreaterThan(0)
      buttons.forEach((button) => {
        expect(button.hasAttribute('data-theme')).toBe(true)
        expect(button.tagName).toBe('BUTTON')
      })
    })
  })

  it('throws when no theme selection buttons are present', async () => {
    await renderThemePickerDom(({ element }) => {
      element.querySelectorAll('[data-theme]').forEach((button) => button.remove())

      expect(() => getThemeSelectBtns(element)).toThrowError(ClientScriptError)
    })
  })
})
