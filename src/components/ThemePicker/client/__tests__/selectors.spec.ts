import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ThemePickerFixture from '@components/ThemePicker/client/__fixtures__/index.fixture.astro'
import type { ThemePickerElement } from '@components/ThemePicker/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  getThemePickerCloseBtn,
  getThemePickerModal,
  getThemePickerToggleBtn,
  getThemeSelectBtns,
  queryMetaThemeColor,
  queryThemePickerEmblaNextBtn,
  queryThemePickerEmblaPrevBtn,
  queryThemePickerEmblaViewport,
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

      expect(modal.hasAttribute('data-theme-modal'), 'ThemePicker modal should have [data-theme-modal]').toBe(true)
      expect(modal.dataset['themeModal'], 'ThemePicker modal dataset.themeModal should be set').toBe('')
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

      expect(toggleBtn.classList.contains('theme-toggle-btn'), 'Theme toggle button should have .theme-toggle-btn').toBe(
        true,
      )
      expect(toggleBtn.getAttribute('aria-label'), 'Theme toggle button should have an aria-label').toMatch(
        /toggle theme switcher/i,
      )
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

      expect(closeBtn.matches('[data-theme-close]'), 'ThemePicker close button should match [data-theme-close]').toBe(
        true,
      )
      expect(closeBtn.getAttribute('aria-label'), 'ThemePicker close button should have an aria-label').toMatch(
        /close theme picker dialog/i,
      )
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

      expect(buttons.length, 'ThemePicker should render at least one theme button').toBeGreaterThan(0)
      buttons.forEach((button) => {
        expect(button.hasAttribute('data-theme'), 'Theme buttons should include [data-theme]').toBe(true)
        expect(button.tagName, 'Theme buttons should be <button> elements').toBe('BUTTON')
      })
    })
  })

  it('exposes Embla selectors within the custom element scope', async () => {
    await renderThemePickerDom(({ element }) => {
      const viewport = queryThemePickerEmblaViewport(element)
      const prevBtn = queryThemePickerEmblaPrevBtn(element)
      const nextBtn = queryThemePickerEmblaNextBtn(element)

      expect(viewport, 'ThemePicker Embla viewport should exist with [data-theme-embla-viewport]').toBeInstanceOf(
        HTMLDivElement,
      )
      expect(prevBtn, 'ThemePicker Embla prev button should exist with [data-theme-embla-prev]').toBeInstanceOf(
        HTMLButtonElement,
      )
      expect(nextBtn, 'ThemePicker Embla next button should exist with [data-theme-embla-next]').toBeInstanceOf(
        HTMLButtonElement,
      )
    })
  })

  it('returns null when meta theme-color tag is not present', async () => {
    await renderThemePickerDom(() => {
      document.querySelector('meta[name="theme-color"]')?.remove()

      expect(queryMetaThemeColor(document), 'queryMetaThemeColor should return null when meta tag is missing').toBeNull()
    })
  })

  it('throws when no theme selection buttons are present', async () => {
    await renderThemePickerDom(({ element }) => {
      element.querySelectorAll('[data-theme]').forEach((button) => button.remove())

      expect(() => getThemeSelectBtns(element)).toThrowError(ClientScriptError)
    })
  })
})
