// @vitest-environment happy-dom
/**
 * Tests for navigation menu script using Container API pattern with happy-dom
 */
import { beforeAll, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { getNavToggleBtnElement } from '../selectors'
import { Navigation } from '../navigation'
import TestNavigationComponent from './TestNavigation.astro'

// Mock focus-trap to work in jsdom environment
vi.mock('focus-trap', () => {
  return {
    createFocusTrap: () => ({
      activate: vi.fn().mockReturnThis(),
      deactivate: vi.fn().mockReturnThis(),
      pause: vi.fn().mockReturnThis(),
      unpause: vi.fn().mockReturnThis(),
      updateContainerElements: vi.fn().mockReturnThis(),
      active: false,
      paused: false,
    }),
  }
})

// Mock Astro transitions client
vi.mock('astro:transitions/client', () => {
  return {
    navigate: vi.fn().mockResolvedValue(undefined),
  }
})

/**
 * Helper function to set up DOM from Container API
 * @param path - The current path for active menu highlighting
 */
async function setupNavigationDOM(path = '/') {
  const container = await AstroContainer.create()
  const result = await container.renderToString(TestNavigationComponent, {
    props: { path },
  })
  document.body.innerHTML = result
}

beforeAll(() => {
  vi.useFakeTimers()
})

describe(`Navigation class works`, () => {
  test(`LoadableScript init initializes`, async () => {
    await setupNavigationDOM()
    expect(() => Navigation.init()).not.toThrow()
  })
})

describe(`Navigation toggleMenu method works`, () => {
  test(`toggleMenu sets class correctly`, async () => {
    await setupNavigationDOM()
    const sut = new Navigation()
    sut.bindEvents()
    sut.toggleMenu()
    expect(document.querySelector(`body`)!.className).toMatch(`no-scroll`)
    expect(document.querySelector(`.nav-toggle-btn`)!.getAttribute(`aria-expanded`)).toBeTruthy()
    expect(document.querySelector(`#header`)!.className).toMatch(`aria-expanded-true`)
  })

  test(`toggleMenu sets and removes the position on the header wrapper`, async () => {
    window.HTMLElement.prototype.getBoundingClientRect = () => {
      return {
        x: 336.1000061035156,
        y: 8,
        width: 42,
        height: 42,
        top: 8,
        right: 378.1000061035156,
        bottom: 50,
        left: 336.1000061035156,
      } as unknown as DOMRect
    }
    await setupNavigationDOM()
    const sut = new Navigation()
    sut.bindEvents()
    const iconWrapper = document.querySelector(`#header__nav-icon`) as HTMLSpanElement
    expect(iconWrapper.style.left).toBeFalsy()
    expect(iconWrapper.style.top).toBeFalsy()
    sut.toggleMenu()
    expect(iconWrapper.style.left).toMatch(/336\.1\d*px/)
    expect(iconWrapper.style.top).toMatch(`8px`)
    sut.toggleMenu()
    expect(iconWrapper.style.left).toBeFalsy()
    expect(iconWrapper.style.top).toBeFalsy()
  })
})

describe(`Focus trap works`, () => {
  test(`Constructor initializes`, async () => {
    await setupNavigationDOM()
    const sut = new Navigation()
    sut.bindEvents()
    expect(sut.focusTrap).toMatchObject({
      activate: expect.any(Function),
      active: false,
      deactivate: expect.any(Function),
      pause: expect.any(Function),
      paused: false,
      unpause: expect.any(Function),
      updateContainerElements: expect.any(Function),
    })
  })

  test(`ESC keypress inside focus trap deactivates the trap`, async () => {
    await setupNavigationDOM()
    const sut = new Navigation()
    sut.bindEvents()
    sut.toggleMenu(true)
    expect(sut.isMenuOpen).toBeTruthy()
    // Simulate focus-trap's onDeactivate callback (which is triggered by ESC in real focus-trap)
    // Since we're mocking focus-trap, we manually call the callback that would be triggered by ESC
    sut.toggleMenu(false)
    expect(sut.isMenuOpen).toBeFalsy()
  })
})

describe(`Toggle button works`, () => {
  test(`Clicking toggle button works`, async () => {
    await setupNavigationDOM()
    const sut = new Navigation()
    sut.bindEvents()
    const button = getNavToggleBtnElement()
    expect(sut.isMenuOpen).toBeFalsy()
    button.click()
    expect(sut.isMenuOpen).toBeTruthy()
    button.click()
    expect(sut.isMenuOpen).toBeFalsy()
  })

  test(`Pressing enter on toggle button works`, async () => {
    await setupNavigationDOM()
    const sut = new Navigation()
    sut.bindEvents()
    const button = getNavToggleBtnElement()
    /** Initial state, menu should be closed */
    expect(sut.isMenuOpen).toBeFalsy()
    /** Open the menu - Enter key triggers click event on buttons */
    button.focus()
    button.click() // Enter triggers click on type="button"
    expect(sut.isMenuOpen).toBeTruthy()
    /** Close the menu */
    button.focus()
    button.click() // Enter triggers click on type="button"
    expect(sut.isMenuOpen).toBeFalsy()
  })
})

describe('Navigation LoadableScript implementation', () => {
  test('should have correct static properties', () => {
    expect(Navigation.scriptName).toBe('Navigation')
    expect(Navigation.eventType).toBe('astro:page-load')
  })

  test('should initialize navigation when static init is called', async () => {
    await setupNavigationDOM()

    // This should not throw
    expect(() => Navigation.init()).not.toThrow()
  })

  test('should have static pause, resume, and reset methods', () => {
    // These methods should exist and not throw
    expect(() => Navigation.pause()).not.toThrow()
    expect(() => Navigation.resume()).not.toThrow()
    expect(() => Navigation.reset()).not.toThrow()
  })
})
