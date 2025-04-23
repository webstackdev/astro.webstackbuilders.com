/**
 * Tests for Theme Picker HTML element selectors
 */
import { resolve } from "path"
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest"
import { loadHtmlTemplate } from "@test/unit/helpers/workers"
import storage from "@content/_storage"
import { getThemePickerItemCard } from "./testHelper"
import { SELECTORS } from "../selectors"
import { CLASSES, setupThemePicker, ThemePicker, type ThemeIds } from "../setup"

const templatePath = resolve(
  process.cwd(),
  `src/assets/script/modules/themePicker/__fixtures__/setup.njk`
)
let templateDom: string

const triggerTransitionEnd = (element: Element) => {
  const event = new Event(`transitionend`)
  element.dispatchEvent(event)
}

const triggerClick = (button: Element) => {
  const event = new Event(`click`)
  button.dispatchEvent(event)
}

beforeAll(async () => {
  templateDom = await loadHtmlTemplate(templatePath)
})

beforeEach(() => {
  /** Local storage is mocked */
  localStorage.clear()
  // @ts-ignore
  localStorage.getItem.mockClear()
  // @ts-ignore
  localStorage.setItem.mockClear()
  /** 11ty global data not available when rendering single templates so script doesn't have key */
  document.documentElement.setAttribute(`data-theme`, `default`)
  /**
   * Mock for matchMedia, not provided by JSDOM. Could be moved to a header directive
   * like quiet mode. Needed by all tests using ThemePicker methods.
   */
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: undefined,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

const setup = () => {
  document.documentElement.innerHTML = templateDom
  const menu = document.querySelector(`#theme-menu`)!
  const themes: ThemeIds[] = [`default`, `dark`, `holiday`]
  menu.innerHTML = themes.reduce((menuItems, currentThemeId) => {
    return menuItems.concat(getThemePickerItemCard(currentThemeId))
  }, ``)
}

describe(`Make sure test is set up correctly for jest-localstorage-mock`, () => {
  test('should not impact the next test', () => {
    const KEY = 'foo'
    const VALUE = 'bar'
    localStorage.setItem(KEY, VALUE)
    expect(localStorage.setItem).toHaveBeenLastCalledWith(KEY, VALUE)
    expect(localStorage['__STORE__'][KEY]).toBe(VALUE)
    expect(Object.keys(localStorage['__STORE__'])).toHaveLength(1)
  })

  test('should not be impacted by the previous test', () => {
    const KEY = 'baz'
    const VALUE = 'zab'
    localStorage.setItem(KEY, VALUE)
    expect(localStorage.setItem).toHaveBeenLastCalledWith(KEY, VALUE)
    expect(localStorage['__STORE__'][KEY]).toBe(VALUE)
    expect(Object.keys(localStorage['__STORE__'])).toHaveLength(1)
  })
})

/* eslint-disable no-new */
describe(`ThemePicker class works`, () => {
  test(`ThemePicker constructor does not change HTML`, () => {
    setup()
    const beforeHtml = document.documentElement.innerHTML
    new ThemePicker()
    const afterHtml = document.documentElement.innerHTML
    expect(beforeHtml).toEqual(afterHtml)
  })

  test(`hasLocalStorage works`, () => {
    setup()
    const picker = new ThemePicker()
    expect(picker.hasLocalStorage()).toBeTruthy()
  })

  test(`script in src/_layouts/components/themePicker/script.njk is added to document`, () => {
    setup()
    const script = document.querySelector(`script`)!
    expect(script.innerHTML).toEqual(expect.any(String))
  })

  const userButtonActions = [`click`, `keyup`, `touchend`]

  test.skip(`bindEvents sets listeners on close, toggle, and nav buttons`, () => {
    setup()
    const closeBtn = document.querySelector(`.themepicker__closeBtn`)!
    closeBtn.addEventListener = vi.fn()
    const toggleBtn = document.querySelector(`.themepicker-toggle__toggle-btn`)!
    toggleBtn.addEventListener = vi.fn()
    const navBtn = document.querySelector(`.nav-icon__toggle-btn`)!
    navBtn.addEventListener = vi.fn()
    const picker = new ThemePicker()
    picker.bindEvents()
    // @ts-ignore
    expect(closeBtn.addEventListener.mock.calls).toHaveLength(3)
    const closeBtnAddedListeners = [
      // @ts-ignore
      closeBtn.addEventListener.mock.calls[0][0], // first argument of the first call
      // @ts-ignore
      closeBtn.addEventListener.mock.calls[1][0], // second argument of the first call
      // @ts-ignore
      closeBtn.addEventListener.mock.calls[2][0], // third argument of the first call
    ]
    expect(closeBtnAddedListeners).toEqual(expect.arrayContaining(userButtonActions))
    // @ts-ignore
    expect(toggleBtn.addEventListener.mock.calls).toHaveLength(3) // @TODO: received 0
    const toggleBtnAddedListeners = [
      // @ts-ignore
      toggleBtn.addEventListener.mock.calls[0][0], // first argument of the first call
      // @ts-ignore
      toggleBtn.addEventListener.mock.calls[1][0], // second argument of the first call
      // @ts-ignore
      toggleBtn.addEventListener.mock.calls[2][0], // third argument of the first call
    ]
    expect(toggleBtnAddedListeners).toEqual(expect.arrayContaining(userButtonActions))
    // @ts-ignore
    expect(navBtn.addEventListener.mock.calls).toHaveLength(3)
    const navBtnAddedListeners = [
      // @ts-ignore
      navBtn.addEventListener.mock.calls[0][0], // first argument of the first call
      // @ts-ignore
      navBtn.addEventListener.mock.calls[1][0], // second argument of the first call
      // @ts-ignore
      navBtn.addEventListener.mock.calls[2][0], // third argument of the first call
    ]
    expect(navBtnAddedListeners).toEqual(expect.arrayContaining(userButtonActions))
  })

  test(`bindEvents sets listeners on item buttons`, () => {
    setup()
    const itemButtons = document.querySelectorAll(`.themepicker__selectBtn`)
    itemButtons.forEach(button => {
      button.addEventListener = vi.fn()
    })
    const picker = new ThemePicker()
    picker.bindEvents()
    expect.assertions(6) // three items added in setup
    itemButtons.forEach(button => {
      // @ts-ignore
      expect(button.addEventListener.mock.calls).toHaveLength(3)
      const buttonAddedListeners = [
        // @ts-ignore
        button.addEventListener.mock.calls[0][0], // first argument of the first call
        // @ts-ignore
        button.addEventListener.mock.calls[1][0], // second argument of the first call
        // @ts-ignore
        button.addEventListener.mock.calls[2][0], // third argument of the first call
      ]
      expect(buttonAddedListeners).toEqual(expect.arrayContaining(userButtonActions))
    })
  })
})

describe(`Preferences are respected`, () => {
  test(`getStoredPreference returns false when no preference stored`, () => {
    setup()
    const picker = new ThemePicker()
    const sut = picker.getStoredPreference()
    expect(sut).toBeFalsy()
    expect(typeof sut === `boolean`).toBeTruthy()
    expect(localStorage['__STORE__']).toHaveLength(0)
  })

  test(`getStoredPreference returns the key name when preference is stored`, () => {
    setup()
    expect(localStorage['__STORE__']).toHaveLength(0)
    localStorage.setItem(storage.THEME_STORAGE_KEY, `holiday`)
    expect(localStorage['__STORE__']).toHaveLength(1)
    const picker = new ThemePicker()
    const sut = picker.getStoredPreference()
    expect(sut).toMatch(`holiday`)
  })

  test(`getSystemPreference returns false when no system preference`, () => {
    setup()
    const picker = new ThemePicker()
    const sut = picker.getSystemPreference()
    expect(sut).toBeFalsy()
    expect(typeof sut === `boolean`).toBeTruthy()
  })

  test(`getSystemPreference returns dark theme when system preference is set`, () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: true,
        media: query,
        onchange: undefined,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    setup()
    const picker = new ThemePicker()
    const sut = picker.getSystemPreference()
    expect(sut).toMatch(`dark`)
  })

  test(`getInitialActiveTheme method works with no stored or system preference`, () => {
    setup()
    const picker = new ThemePicker()
    const sut = picker.getInitialActiveTheme()
    expect(sut).toMatch(`default`)
  })

  test(`getInitialActiveTheme method works when system preference is set`, () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: true,
        media: query,
        onchange: undefined,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    setup()
    const picker = new ThemePicker()
    const sut = picker.getInitialActiveTheme()
    expect(sut).toMatch(`dark`)
  })

  test(`getInitialActiveTheme method prefers stored when both it and system are set`, () => {
    expect(localStorage['__STORE__']).toHaveLength(0)
    localStorage.setItem(storage.THEME_STORAGE_KEY, `holiday`)
    expect(localStorage['__STORE__']).toHaveLength(1)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: true,
        media: query,
        onchange: undefined,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    setup()
    const picker = new ThemePicker()
    const sut = picker.getInitialActiveTheme()
    expect(sut).toMatch(`holiday`)
  })
})

describe(`setActiveItem works`, () => {
  test(`sets the active class on the active theme card item and not the others`, () => {
    setup()
    const picker = new ThemePicker()
    picker.activeTheme = `holiday`
    picker.setActiveItem()

    const holidayItem = document.querySelector(`[aria-label="select color theme 'HOLIDAY'"]`)
    // @ts-ignore
    expect(holidayItem.parentElement).toHaveClass(CLASSES.active)

    const darkItem = document.querySelector(`[aria-label="select color theme 'DARK'"]`)
    // @ts-ignore
    expect(darkItem.parentElement).not.toHaveClass(CLASSES.active)

    const defaultItem = document.querySelector(`[aria-label="select color theme 'DEFAULT'"]`)
    // @ts-ignore
    expect(defaultItem.parentElement).not.toHaveClass(CLASSES.active)
  })

  test(`sets the ARIA checked attribute on the active theme card item button and not the others`, () => {
    setup()
    const picker = new ThemePicker()
    picker.activeTheme = `holiday`
    picker.setActiveItem()

    const holidayItem = document.querySelector(`[aria-label="select color theme 'HOLIDAY'"]`)
    // @ts-ignore
    expect(holidayItem).toHaveAttribute(`aria-checked`, `aria-checked`)

    const darkItem = document.querySelector(`[aria-label="select color theme 'DARK'"]`)
    // @ts-ignore
    expect(darkItem).not.toHaveAttribute(`aria-checked`, `aria-checked`)

    const defaultItem = document.querySelector(`[aria-label="select color theme 'DEFAULT'"]`)
    // @ts-ignore
    expect(defaultItem).not.toHaveAttribute(`aria-checked`, `aria-checked`)
  })
})

describe(`setTheme works`, () => {
  test(`Executes all steps to set theme`, () => {
    setup()
    const picker = new ThemePicker()
    picker.init()
    picker.setTheme(`holiday`)
    /** 1. Updates class state with new theme */
    expect(picker.activeTheme).toMatch(`holiday`)
    /** 2. Document body element has the theme name as an attribute: <body data-theme="default"> */
    // @ts-ignore
    expect(document.documentElement).toHaveAttribute(`data-theme`, `holiday`) // <body>
    /** 3. Update the theme name in local storage, used for persistence between site visits */
    expect(localStorage['__STORE__']).toHaveLength(1)
    expect(localStorage['__STORE__'][storage.THEME_STORAGE_KEY]).toMatch(`holiday`)
    /** 4. Update the meta element set in meta.njk for theme-color:
     *       <meta name="theme-color" content="#FFFFFF">
     *     Used to set the color of the surrounding user interface for e.g. the
     *     browser title bar. It is updated by script when the theme changes.
     */
    const themeMetaElement = document.querySelector(`[name="theme-color"]`)
    // @ts-ignore
    expect(themeMetaElement).toHaveAttribute(`content`, `#FFFFFF`)
    /**
     *  5. Add attribute to the theme item card when its theme is the current site theme
     *     for styling and remove it from any others
     */
    const holidayItem = document.querySelector(`[aria-label="select color theme 'HOLIDAY'"]`)
    // @ts-ignore
    expect(holidayItem.parentElement).toHaveClass(CLASSES.active)

    const darkItem = document.querySelector(`[aria-label="select color theme 'DARK'"]`)
    // @ts-ignore
    expect(darkItem.parentElement).not.toHaveClass(CLASSES.active)

    const defaultItem = document.querySelector(`[aria-label="select color theme 'DEFAULT'"]`)
    // @ts-ignore
    expect(defaultItem.parentElement).not.toHaveClass(CLASSES.active)
  })
})

describe(`shouldOpen logic correct for all possible states`, () => {
  test(`isOpen flips to false if it was true and forceOpen is undefined`, () => {
    setup()
    const picker = new ThemePicker()
    picker.isModalOpen = true
    const sut = picker.shouldOpen()
    expect(sut).toEqual(expect.any(Boolean))
    expect(sut).toBeFalsy()
  })

  test(`isOpen flips to true if it was false and forceOpen is undefined`, () => {
    setup()
    const picker = new ThemePicker()
    picker.isModalOpen = false
    const sut = picker.shouldOpen()
    expect(sut).toEqual(expect.any(Boolean))
    expect(sut).toBeTruthy()
  })

  test(`isOpen stays true if it was true and forceOpen is true`, () => {
    setup()
    const picker = new ThemePicker()
    picker.isModalOpen = true
    const sut = picker.shouldOpen(true)
    expect(sut).toEqual(expect.any(Boolean))
    expect(sut).toBeTruthy()
  })

  test(`isOpen flips to true if it was false and forceOpen is true`, () => {
    setup()
    const picker = new ThemePicker()
    picker.isModalOpen = false
    const sut = picker.shouldOpen(true)
    expect(sut).toEqual(expect.any(Boolean))
    expect(sut).toBeTruthy()
  })

  test(`isOpen flips to false if it was true and forceOpen is false`, () => {
    setup()
    const picker = new ThemePicker()
    picker.isModalOpen = true
    const sut = picker.shouldOpen(false)
    expect(sut).toEqual(expect.any(Boolean))
    expect(sut).toBeFalsy()
  })

  test(`isOpen stays false if it was false and forceOpen is false`, () => {
    setup()
    const picker = new ThemePicker()
    picker.isModalOpen = false
    const sut = picker.shouldOpen(false)
    expect(sut).toEqual(expect.any(Boolean))
    expect(sut).toBeFalsy()
  })
})

describe(`togglePicker works`, () => {
  test.skip(`Change picker to open`, () => {
    vi.useFakeTimers()
    setup()
    const picker = new ThemePicker()
    picker.init()
    picker.isModalOpen = false
    picker.togglePicker()

    /** 1. Adds the aria-expanded attribute to the toggle button */
    const toggleBtn = document.querySelector(SELECTORS.toggleBtn)
    // @ts-ignore
    expect(toggleBtn).toHaveAttribute(`aria-expanded`, `true`)

    /** 2. Removes the hidden property from the theme picker modal */
    const themePickerModal = document.querySelector(SELECTORS.pickerModal)
    // @ts-ignore
    expect(themePickerModal).not.toHaveAttribute(`hidden`)

    /** 3. Adds the is-open class to the theme picker modal */
    vi.runAllTimers()
    // @ts-ignore
    expect(themePickerModal).toHaveClass(CLASSES.open) // @TODO: At least one expected class must be provided.

    /** 4. Sets focus to the currently selected theme item in the modal */
    const currentThemeItem = document.querySelector(`[aria-label="select color theme 'DEFAULT'"]`)
    // @ts-ignore
    expect(currentThemeItem).toHaveFocus()
    vi.useRealTimers()
  })

  test.skip(`Change picker to close`, () => {
    setup()
    const picker = new ThemePicker()
    picker.init()
    picker.isModalOpen = true
    picker.togglePicker()
    /** 1. Removes the aria-expanded attribute from the toggle button */
    const toggleBtn = document.querySelector(SELECTORS.toggleBtn)
    // @ts-ignore
    expect(toggleBtn).not.toHaveAttribute(`aria-expanded`, `aria-expanded`)

    /** 2. Sets the theme picker modal to hidden when the CSS transition has completed */
    const themePickerModal = document.querySelector(SELECTORS.pickerModal)!
    triggerTransitionEnd(themePickerModal)
    // @ts-ignore
    expect(themePickerModal).toHaveAttribute(`hidden`)

    /** 3. Removes the is-open class from the theme picker modal */
    // @ts-ignore
    expect(themePickerModal).not.toHaveClass(CLASSES.open) // @TODO: received: themepicker

    /** 4. Sets focus to the toggle button */
    // @ts-ignore
    expect(toggleBtn).toHaveFocus()
  })
})

describe(`Integration tests`, () => {
  test.skip(`Clicking toggle button opens the modal if it is closed`, () => {
    vi.useFakeTimers()
    setup()
    const picker = new ThemePicker()
    picker.init()
    picker.isModalOpen = false
    const themePickerModal = document.querySelector(SELECTORS.pickerModal)!
    // @ts-ignore
    expect(themePickerModal).not.toHaveClass(CLASSES.open) // @TODO: received: themepicker
    const toggleBtn = document.querySelector(SELECTORS.toggleBtn)!
    triggerClick(toggleBtn)
    vi.runAllTimers()
    // @ts-ignore
    expect(themePickerModal).toHaveClass(CLASSES.open)
    vi.useRealTimers()
  })

  test(`Clicking non-active theme item sets it to active theme`, () => {
    vi.useFakeTimers()
    setup()
    const picker = new ThemePicker()
    picker.init()
    picker.isModalOpen = false
    const holidayItemBtn = document.querySelector(`[aria-label="select color theme 'HOLIDAY'"]`)!
    triggerClick(holidayItemBtn)
    vi.runAllTimers()
    // @ts-ignore
    expect(picker.activeTheme).toMatch(`holiday`)
    vi.useRealTimers()
  })
})

describe(`setupThemePicker`, () => {
  // @ts-ignore
  globalThis.CSS = {
    // @ts-ignore
    supports: jest
      .fn()
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(() => false),
  }

  beforeEach(() => {
    // @ts-ignore
    //CSS.supports.mockClear()
  })

  // @TODO: Getting ReferenceError: CSS is not defined in the setup.ts file
  test.skip(`Executes theme picker init when CSS variables are supported`, () => {
    setup()
    setupThemePicker()
    // @ts-ignore
    expect(CSS.supports.mock.calls).toHaveLength(1)
    /** Proxy check for whether ThemePicker class initialized */
    const defaultItem = document.querySelector(`[aria-label="select color theme 'DEFAULT'"]`)
    // @ts-ignore
    expect(defaultItem.parentElement).toHaveClass(CLASSES.active)
  })

  test.skip(`Does not execute theme picker init when CSS variables are not supported`, () => {
    setup()
    setupThemePicker()
    // @ts-ignore
    expect(CSS.supports.mock.calls).toHaveLength(1)
    /** Proxy check for whether ThemePicker class initialized */
    const defaultItem = document.querySelector(`[aria-label="select color theme 'DEFAULT'"]`)
    // @ts-ignore
    expect(defaultItem.parentElement).not.toHaveClass(CLASSES.active)
  })
})
/* eslint-enable no-new */
