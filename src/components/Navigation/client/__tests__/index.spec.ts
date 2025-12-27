import { beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { TestError } from '@test/errors'
import TestNavigationComponent from '@components/Navigation/client/__tests__/TestNavigation.astro'
import {
  isAnchorElement,
  isButtonElement,
  isHeaderElement,
  isUlElement,
} from '@components/scripts/assertions/elements'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

const setOverlayPauseStateMock = vi.fn()

vi.mock('@components/scripts/store', () => ({
  setOverlayPauseState: setOverlayPauseStateMock,
}))

const navigateMock = vi.fn()
const focusTrapMock = {
  activate: vi.fn(),
  deactivate: vi.fn(),
  pause: vi.fn(),
  unpause: vi.fn(),
  updateContainerElements: vi.fn(),
  active: false,
  paused: false,
}

vi.mock('focus-trap', () => {
  return {
    createFocusTrap: () => focusTrapMock,
  }
})

vi.mock('astro:transitions/client', () => {
  return {
    navigate: navigateMock,
  }
})

type NavigationComponent = HTMLElementTagNameMap['site-navigation']
type NavigationComponentModule = WebComponentModule<NavigationComponent>

describe('NavigationElement web component behavior', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
    navigateMock.mockClear()
    focusTrapMock.activate.mockClear()
    focusTrapMock.deactivate.mockClear()
    setOverlayPauseStateMock.mockClear()
  })

  const renderNavigation = async (
    assertion: (_context: { element: NavigationComponent }) => Promise<void> | void
  ) => {
    await executeRender<NavigationComponentModule>({
      container,
      component: TestNavigationComponent,
      moduleSpecifier: '@components/Navigation/client/index',
      waitForReady: async (element: NavigationComponent) => {
        await element.updateComplete
      },
      assert: async ({ element }) => {
        await assertion({ element })
      },
    })
  }

  test('toggleMenu toggles menu visibility classes', async () => {
    vi.useFakeTimers()
    await renderNavigation(async () => {
      const menu = document.querySelector('.main-nav-menu')
      const header = document.querySelector('#header')
      const toggleButton = document.querySelector('.nav-toggle-btn')

      if (!isUlElement(menu) || !isHeaderElement(header) || !isButtonElement(toggleButton)) {
        throw new TestError('Navigation DOM structure is missing expected elements')
      }

      expect(toggleButton.getAttribute('aria-label')).toBe('Open main menu')
      toggleButton.click()

      expect(document.body.classList.contains('no-scroll')).toBe(true)
      expect(header.classList.contains('aria-expanded-true')).toBe(true)
      expect(toggleButton.getAttribute('aria-label')).toBe('Close main menu')
      expect(menu.classList.contains('menu-visible')).toBe(false)
      expect(setOverlayPauseStateMock).toHaveBeenNthCalledWith(1, 'navigation', true)

      vi.advanceTimersByTime(600)
      expect(menu.classList.contains('menu-visible')).toBe(true)

      toggleButton.click()
      expect(document.body.classList.contains('no-scroll')).toBe(false)
      expect(header.classList.contains('aria-expanded-true')).toBe(false)
      expect(toggleButton.getAttribute('aria-label')).toBe('Open main menu')
      expect(menu.classList.contains('menu-visible')).toBe(false)
      expect(setOverlayPauseStateMock).toHaveBeenNthCalledWith(2, 'navigation', false)
    })
    vi.useRealTimers()
  })

  test('Escape key closes the menu', async () => {
    await renderNavigation(async () => {
      const toggleButton = document.querySelector('.nav-toggle-btn')
      if (!isButtonElement(toggleButton)) {
        throw new TestError('Navigation toggle button not found')
      }
      toggleButton.click()
      expect(document.body.classList.contains('no-scroll')).toBe(true)

      document.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'Escape' }))
      expect(document.body.classList.contains('no-scroll')).toBe(false)
    })
  })

  test('nav links trigger Astro navigate', async () => {
    await renderNavigation(async () => {
      const firstLink = document.querySelector('.main-nav-menu a')
      if (!isAnchorElement(firstLink)) {
        throw new TestError('Navigation link not found')
      }
      firstLink.click()
      expect(navigateMock).toHaveBeenCalledWith(firstLink.getAttribute('href'))
    })
  })

  test('focus trap activate/deactivate when menu toggles', async () => {
    await renderNavigation(async () => {
      const toggleButton = document.querySelector('.nav-toggle-btn')
      if (!isButtonElement(toggleButton)) {
        throw new TestError('Navigation toggle button not found')
      }
      toggleButton.click()
      expect(focusTrapMock.activate).toHaveBeenCalled()

      toggleButton.click()
      expect(focusTrapMock.deactivate).toHaveBeenCalled()
    })
  })
})
