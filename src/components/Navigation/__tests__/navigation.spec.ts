/**
 * Tests for navigation menu script
 */
import { beforeAll, describe, expect, test, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { getNavToggleBtnElement } from "../selectors"
import { Navigation, setupNavigation } from "../navigation"
import { navHtml } from "../__fixtures__/navigationHtml"

beforeAll(() => {
  vi.useFakeTimers()
})

describe(`Navigation class works`, () => {
  test(`Setup initializes`, () => {
    document.body.innerHTML = navHtml
    expect(() => setupNavigation()).not.toThrow()
  })
})

describe(`Navigation toggleMenu method works`, () => {
  test(`toggleMenu sets class correctly`, () => {
    document.body.innerHTML = navHtml
    const sut = new Navigation()
    sut.bindEvents()
    sut.toggleMenu()
    expect(document.querySelector(`body`)!.className).toMatch(`no-scroll`)
    expect(
      document.querySelector(`.nav-icon__toggle-btn`)!.getAttribute(`aria-expanded`)
    ).toBeTruthy()
    expect(document.querySelector(`#header`)!.className).toMatch(`aria-expanded-true`)
  })

  test(`toggleMenu sets and removes the position on the header wrapper`, () => {
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
    document.body.innerHTML = navHtml
    const sut = new Navigation()
    sut.bindEvents()
    const iconWrapper = document.querySelector(`#header__nav-icon`) as HTMLSpanElement
    expect(iconWrapper.style.left).toBeFalsy()
    expect(iconWrapper.style.top).toBeFalsy()
    sut.toggleMenu()
    expect(iconWrapper.style.left).toMatch(`336.1000061035156px`)
    expect(iconWrapper.style.top).toMatch(`8px`)
    sut.toggleMenu()
    expect(iconWrapper.style.left).toBeFalsy()
    expect(iconWrapper.style.top).toBeFalsy()
  })
})

describe(`Focus trap works`, () => {
  test(`Constructor initializes`, () => {
    document.body.innerHTML = navHtml
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
    document.body.innerHTML = navHtml
    const sut = new Navigation()
    sut.bindEvents()
    sut.toggleMenu(true)
    const user = userEvent.setup()
    expect(sut.isMenuOpen).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(sut.isMenuOpen).toBeFalsy()
  })
})

describe(`Toggle button works`, () => {
  test(`Clicking toggle button works`, async () => {
    document.body.innerHTML = navHtml
    const sut = new Navigation()
    sut.bindEvents()
    const user = userEvent.setup()
    const button = getNavToggleBtnElement()
    expect(sut.isMenuOpen).toBeFalsy()
    await user.click(button)
    expect(sut.isMenuOpen).toBeTruthy()
    await user.click(button)
    expect(sut.isMenuOpen).toBeFalsy()
  })

  test(`Pressing enter on toggle button works`, async () => {
    document.body.innerHTML = navHtml
    const sut = new Navigation()
    sut.bindEvents()
    const user = userEvent.setup()
    const button = getNavToggleBtnElement()
    /** Initial state, menu should be closed */
    expect(sut.isMenuOpen).toBeFalsy()
    /** Open the menu */
    button.focus()
    await user.keyboard('{Enter}')
    expect(sut.isMenuOpen).toBeTruthy()
    /** Close the menu */
    button.focus()
    await user.keyboard('{Enter}')
    expect(sut.isMenuOpen).toBeFalsy()
  })
})
