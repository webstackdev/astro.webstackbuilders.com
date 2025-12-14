
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { TestError } from '@test/errors'
import ConsentBanner from '@components/Consent/Banner/index.astro'
import type { ConsentBannerElement } from '@components/Consent/Banner/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  executeRender,
  loadWebComponentModule,
  withJsdomEnvironment,
} from '@test/unit/helpers/litRuntime'

vi.mock('@components/scripts/store', () => {
  const showConsentBanner = vi.fn()
  const hideConsentBanner = vi.fn()
  const initConsentCookies = vi.fn(() => true)
  const allowAllConsentCookies = vi.fn()

  return {
    showConsentBanner,
    hideConsentBanner,
    initConsentCookies,
    allowAllConsentCookies,
  }
})

import * as consentStore from '@components/scripts/store'

const showConsentBannerMock = vi.mocked(consentStore.showConsentBanner)
const hideConsentBannerMock = vi.mocked(consentStore.hideConsentBanner)
const initConsentCookiesMock = vi.mocked(consentStore.initConsentCookies)
const allowAllConsentCookiesMock = vi.mocked(consentStore.allowAllConsentCookies)

type ConsentBannerModule = WebComponentModule<ConsentBannerElement>

const CONSENT_READY_TIMEOUT_MS = 2_000
const BANNER_READY_EVENT = 'consent-banner:ready'

const waitForBannerReady = async (element: ConsentBannerElement) => {
  if (element.isInitialized) {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      element.removeEventListener(BANNER_READY_EVENT, onReady)
      reject(new TestError('Consent banner never finished initializing'))
    }, CONSENT_READY_TIMEOUT_MS)

    function onReady() {
      clearTimeout(timeoutId)
      resolve()
    }

    element.addEventListener(BANNER_READY_EVENT, onReady, { once: true })
  })
}

type JsdomWindow = Window & typeof globalThis

const renderConsentBanner = async (
  assertion: (_context: { element: ConsentBannerElement; window: JsdomWindow }) => Promise<void> | void,
) => {
  const container = await AstroContainer.create()

  await executeRender<ConsentBannerModule>({
    container,
    component: ConsentBanner,
    moduleSpecifier: '@components/Consent/Banner/client/index',
    selector: 'consent-banner',
    waitForReady: waitForBannerReady,
    assert: async ({ element, window }) => {
      if (!window) {
        throw new TestError('JSDOM window is not available for consent banner tests')
      }

      await assertion({ element, window: window as JsdomWindow })
    },
  })
}

beforeEach(async () => {
  initConsentCookiesMock.mockReturnValue(true)
  showConsentBannerMock.mockClear()
  hideConsentBannerMock.mockClear()
  initConsentCookiesMock.mockClear()
  allowAllConsentCookiesMock.mockClear()

  await withJsdomEnvironment(async ({ window }) => {
    window.sessionStorage.clear()
    window.localStorage.clear()

    const module = await loadWebComponentModule<ConsentBannerModule>(
      '@components/Consent/Banner/client/index',
    )

    const bannerCtor = module.componentCtor as typeof ConsentBannerElement
    // Reset the static visibility flag so each test starts from a clean slate
    ;(bannerCtor as unknown as { isModalCurrentlyVisible: boolean }).isModalCurrentlyVisible = false
  })
})

describe('ConsentBannerElement', () => {
  it('shows the modal when consent cookies are uninitialized', async () => {
    initConsentCookiesMock.mockReturnValue(true)

    await renderConsentBanner(async ({ window }) => {
      const wrapper = window.document.getElementById('consent-modal-id') as HTMLDivElement | null
      expect(wrapper).not.toBeNull()
      expect(wrapper!.style.display).toBe('block')
      expect(showConsentBannerMock).toHaveBeenCalled()
      expect(window.sessionStorage.getItem('consent-modal-visible')).toBe('true')
      expect(window.sessionStorage.getItem('consent-modal-shown')).toBe('true')

      expect(window.document.activeElement).toBe(wrapper)

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0)
      })
      const allowBtn = window.document.querySelector('.consent-modal__btn-allow') as HTMLButtonElement | null
      expect(allowBtn).not.toBeNull()
      expect(window.document.activeElement).toBe(allowBtn)
    })
  })

  it('skips rendering the modal when consent cookies already exist', async () => {
    initConsentCookiesMock.mockReturnValue(false)

    await renderConsentBanner(({ window }) => {
      const wrapper = window.document.getElementById('consent-modal-id') as HTMLDivElement | null
      expect(wrapper).not.toBeNull()
      expect(wrapper!.style.display).toBe('none')
      expect(showConsentBannerMock).not.toHaveBeenCalled()
    })
  })

  it('hides the banner when the close button is clicked', async () => {
    await renderConsentBanner(({ window }) => {
      const closeBtn = window.document.querySelector('.consent-modal__close-btn') as HTMLButtonElement | null
      expect(closeBtn).not.toBeNull()

      closeBtn!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))

      expect(hideConsentBannerMock).toHaveBeenCalled()
      const wrapper = window.document.getElementById('consent-modal-id') as HTMLDivElement | null
      expect(wrapper!.style.display).toBe('none')
    })
  })

  it('grants all consent when Allow All is triggered', async () => {
    await renderConsentBanner(({ window }) => {
      const allowBtn = window.document.querySelector('.consent-modal__btn-allow') as HTMLButtonElement | null
      expect(allowBtn).not.toBeNull()

      allowBtn!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))

      expect(allowAllConsentCookiesMock).toHaveBeenCalled()
      expect(hideConsentBannerMock).toHaveBeenCalled()
    })
  })

  it('navigates to the consent page when Customize is triggered', async () => {
    await renderConsentBanner(({ element, window }) => {
      const customizeLink = window.document.querySelector('.consent-modal__btn-customize') as HTMLAnchorElement | null
      expect(customizeLink).not.toBeNull()

      const bannerCtor = element.constructor as typeof HTMLElement & {
        navigateToUrl: (_url: string) => void
      }
      const navigateSpy = vi.spyOn(bannerCtor, 'navigateToUrl').mockImplementation(() => {})

      try {
        customizeLink!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))

        expect(navigateSpy).toHaveBeenCalledTimes(1)
        expect(navigateSpy).toHaveBeenCalledWith(expect.stringContaining('/consent'))

        const wrapper = window.document.getElementById('consent-modal-id') as HTMLDivElement | null
        expect(wrapper?.style.display).toBe('none')
      } finally {
        navigateSpy.mockRestore()
      }
    })
  })
})
