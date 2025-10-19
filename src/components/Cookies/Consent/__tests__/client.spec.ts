// @vitest-environment happy-dom
/**
 * Tests for CookieConsent component using Container API pattern with happy-dom
 */
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { CookieConsent } from '../client'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import CookieConsentComponent from '../index.astro'

// With happy-dom, localStorage is automatically provided
// We just need to mock it for test control
beforeEach(() => {
  localStorage.clear()
})

// Mock the cookie and localStorage modules
vi.mock('../state', () => ({
  $cookieModalVisible: {
    set: vi.fn(),
    get: vi.fn(() => false),
  },
}))

vi.mock('../cookies', () => ({
  initConsentCookies: vi.fn().mockReturnValue(true), // Default to showing modal
  allowAllConsentCookies: vi.fn(),
}))

vi.mock('@components/Cookies/Customize/client', () => ({
  showCookieCustomizeModal: vi.fn(),
  CookieCustomize: class MockCookieCustomize {},
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CookieConsent class works', () => {
  test('LoadableScript init initializes', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    expect(() => CookieConsent.init()).not.toThrow()
  })

  test('should have correct static properties', () => {
    expect(CookieConsent.scriptName).toBe('CookieConsent')
    expect(CookieConsent.eventType).toBe('delayed')
  })

  test('constructor initializes DOM elements', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    const cookieConsent = new CookieConsent()
    expect(cookieConsent.wrapper).toBeDefined()
    expect(cookieConsent.closeBtn).toBeDefined()
    expect(cookieConsent.allowBtn).toBeDefined()
    expect(cookieConsent.allowLink).toBeDefined()
    expect(cookieConsent.customizeBtn).toBeDefined()
    expect(cookieConsent.customizeLink).toBeDefined()
  })
})

describe('CookieConsent modal functionality', () => {
  test('initModal shows the modal and focuses allow button', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    const cookieConsent = new CookieConsent()
    const focusSpy = vi.spyOn(cookieConsent.allowBtn, 'focus').mockImplementation(() => {})
    cookieConsent.initModal()
    expect(cookieConsent.wrapper.style.display).toBe('block')
    expect(focusSpy).toHaveBeenCalled()
  })

  test('handleDismissModal hides the modal', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    const cookieConsent = new CookieConsent()
    cookieConsent.wrapper.style.display = 'block'
    cookieConsent.handleDismissModal()
    expect(cookieConsent.wrapper.style.display).toBe('none')
  })

  test('handleWrapperDismissModal calls handleDismissModal and stops propagation', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    const cookieConsent = new CookieConsent()
    const mockEvent = {
      stopPropagation: vi.fn(),
    } as unknown as Event
    cookieConsent.wrapper.style.display = 'block'
    cookieConsent.handleWrapperDismissModal(mockEvent)
    expect(cookieConsent.wrapper.style.display).toBe('none')
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
  })

  test('handleAllowAllCookies calls appropriate functions', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    const { allowAllConsentCookies } = await import('../cookies')
    const cookieConsent = new CookieConsent()
    cookieConsent.wrapper.style.display = 'block'

    cookieConsent.handleAllowAllCookies()

    expect(allowAllConsentCookies).toHaveBeenCalled()
    expect(cookieConsent.wrapper.style.display).toBe('none')
  })

  test('handleCustomizeCookies calls showCookieCustomizeModal', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    const { showCookieCustomizeModal } = await import('@components/Cookies/Customize/client')
    const cookieConsent = new CookieConsent()

    cookieConsent.handleCustomizeCookies()

    expect(showCookieCustomizeModal).toHaveBeenCalled()
  })
})

describe('CookieConsent event handling', () => {
  test('clicking close button dismisses modal', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    const cookieConsent = new CookieConsent()
    cookieConsent.wrapper.style.display = 'block'
    cookieConsent.bindEvents()

    cookieConsent.closeBtn.click()

    expect(cookieConsent.wrapper.style.display).toBe('none')
  })

  test('clicking allow button allows all cookies and dismisses modal', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    const { allowAllConsentCookies } = await import('../cookies')
    const cookieConsent = new CookieConsent()
    cookieConsent.wrapper.style.display = 'block'
    cookieConsent.bindEvents()

    cookieConsent.allowBtn.click()

    expect(allowAllConsentCookies).toHaveBeenCalled()
    expect(cookieConsent.wrapper.style.display).toBe('none')
  })

  test('clicking customize button calls customize handler', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    const { showCookieCustomizeModal } = await import('@components/Cookies/Customize/client')
    const cookieConsent = new CookieConsent()
    cookieConsent.bindEvents()

    cookieConsent.customizeBtn.click()

    expect(showCookieCustomizeModal).toHaveBeenCalled()
  })
})

describe('CookieConsent showModal logic', () => {
  test('showModal does not show when user has already consented', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    const { initConsentCookies } = await import('../cookies')
    vi.mocked(initConsentCookies).mockReturnValue(false) // User already consented

    const cookieConsent = new CookieConsent()
    const focusSpy = vi.spyOn(cookieConsent.allowBtn, 'focus').mockImplementation(() => {})

    cookieConsent.showModal()

    expect(cookieConsent.wrapper.style.display).toBe('none') // Should remain hidden
    expect(focusSpy).not.toHaveBeenCalled()
  })

  test('showModal shows modal when user has not consented', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    const { initConsentCookies } = await import('../cookies')
    vi.mocked(initConsentCookies).mockReturnValue(true) // User needs to consent

    const cookieConsent = new CookieConsent()
    const focusSpy = vi.spyOn(cookieConsent.allowBtn, 'focus').mockImplementation(() => {})

    cookieConsent.showModal()

    expect(cookieConsent.wrapper.style.display).toBe('block')
    expect(focusSpy).toHaveBeenCalled()
  })
})

describe('CookieConsent LoadableScript implementation', () => {
  test('should have static pause, resume, and reset methods', () => {
    expect(typeof CookieConsent.pause).toBe('function')
    expect(typeof CookieConsent.resume).toBe('function')
    expect(typeof CookieConsent.reset).toBe('function')

    // These methods should not throw
    expect(() => CookieConsent.pause()).not.toThrow()
    expect(() => CookieConsent.resume()).not.toThrow()
    expect(() => CookieConsent.reset()).not.toThrow()
  })

  test('should initialize cookie consent when static init is called', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    const { initConsentCookies } = await import('../cookies')
    vi.mocked(initConsentCookies).mockReturnValue(true)

    const focusSpy = vi.fn()
    const allowBtn = document.querySelector('.cookie-modal__btn-allow') as HTMLButtonElement
    allowBtn.focus = focusSpy

    CookieConsent.init()

    const modal = document.getElementById('cookie-modal-id')
    expect(modal?.style.display).toBe('block')
    expect(focusSpy).toHaveBeenCalled()
  })
})
