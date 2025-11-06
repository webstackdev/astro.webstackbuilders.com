/**
 * DOM utilities for ThemePicker component testing
 * Creates minimal DOM structure needed for testing theme picker JavaScript behavior
 */

import { vi } from 'vitest'
import { mockThemes } from '@components/ThemePicker/__fixtures__/mockData'

/**
 * Generates a single theme picker item card HTML
 */
export const getThemePickerItemCard = (themeId: string = 'default'): string => {
  return `
<li class="themepicker__item">
  <button
    class="themepicker__selectBtn"
    aria-label="select color theme '${themeId.toUpperCase()}'"
    data-theme="${themeId}"
  >
    <span class="themepicker__name">${themeId.toUpperCase()}</span>
    <span class="themepicker__palette">
      <span class="themepicker__hue themepicker__hue--primary"></span>
      <span class="themepicker__hue themepicker__hue--secondary"></span>
      <span class="themepicker__hue themepicker__hue--border"></span>
      <span class="themepicker__hue themepicker__hue--textoffset"></span>
      <span class="themepicker__hue themepicker__hue--text"></span>
    </span>
  </button>
</li>
`
}

/**
 * Generates header HTML with theme picker toggle button
 */
export const getHeader = (): string => {
  return `
<header id="header" class="header" role="banner">
  <span id="header__theme-icon" class="header__theme-icon">
    <button class="icon-btn themepicker-toggle__toggle-btn" type="button" aria-expanded="false" aria-owns="theme-menu" aria-label="toggle theme switcher" aria-haspopup="true">
      <svg class="icon icon--theme" role="img" aria-hidden="true" width="24" height="24">
        <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-theme" />
      </svg>
    </button>
  </span>
</header>
`
}

/**
 * Generates the complete theme picker modal HTML structure
 */
export const getThemePickerModalHTML = (): string => {
  const themeItems = mockThemes.map(getThemePickerItemCard).join('')

  return `
<div class="themepicker" hidden>
  <div class="themepicker__header">
    <h3 class="themepicker__title">Select Theme</h3>
    <button class="themepicker__closeBtn" type="button" aria-label="Close theme picker">
      <svg class="icon" width="16" height="16">
        <use href="#icon-close" />
      </svg>
    </button>
  </div>
  <ul class="themepicker__list">
    ${themeItems}
  </ul>
</div>
`
}

/**
 * Setup DOM for testing theme picker
 */
export function setupThemePickerDOM(): void {
  document.body.innerHTML = getHeader() + getThemePickerModalHTML()
}

/**
 * Clean up DOM after tests
 */
export function cleanupThemePickerDOM(): void {
  document.body.innerHTML = ''
}

/**
 * Setup localStorage mock
 */
export function setupLocalStorageMock(): void {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
}

/**
 * Setup matchMedia mock for system theme detection
 */
export function setupMatchMediaMock(matches: boolean = false): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

/**
 * Helper to get specific DOM elements for testing
 */
export const getDOMElements = () => ({
  header: document.querySelector<HTMLElement>('#header'),
  toggleBtn: document.querySelector<HTMLButtonElement>('.themepicker-toggle__toggle-btn'),
  pickerModal: document.querySelector<HTMLElement>('.themepicker'),
  closeBtn: document.querySelector<HTMLButtonElement>('.themepicker__closeBtn'),
  themeSelectBtns: document.querySelectorAll<HTMLButtonElement>('.themepicker__selectBtn'),
})

/**
 * Helper to simulate user interactions
 */
export const userInteractions = {
  clickToggleButton: () => {
    const toggleBtn = document.querySelector<HTMLButtonElement>('.themepicker-toggle__toggle-btn')
    if (toggleBtn) {
      toggleBtn.click()
    }
  },

  clickCloseButton: () => {
    const closeBtn = document.querySelector<HTMLButtonElement>('.themepicker__closeBtn')
    if (closeBtn) {
      closeBtn.click()
    }
  },

  clickThemeButton: (themeId: string) => {
    const themeBtn = document.querySelector<HTMLButtonElement>(`[data-theme="${themeId}"]`)
    if (themeBtn) {
      themeBtn.click()
    }
  },
}
