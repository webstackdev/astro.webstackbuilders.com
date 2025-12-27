import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { TestError } from '@test/errors'
import ConsentBanner from '@components/Consent/Banner/index.astro'
import type { ConsentBannerElement } from '@components/Consent/Banner/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender, withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import {
  getConsentWrapper,
  getConsentCloseBtn,
  getConsentAllowBtn,
  getConsentCustomizeLink,
} from '@components/Consent/Banner/client/selectors'
import { ClientScriptError } from '@components/scripts/errors'

vi.mock('@components/scripts/store', () => ({
  allowAllConsentCookies: vi.fn(),
  hideConsentBanner: vi.fn(),
  initConsentCookies: vi.fn(() => true),
  showConsentBanner: vi.fn(),
}))

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

const renderConsentBanner = async (assertion: () => Promise<void> | void) => {
  const container = await AstroContainer.create()

  await executeRender<ConsentBannerModule>({
    container,
    component: ConsentBanner,
    moduleSpecifier: '@components/Consent/Banner/client/index',
    selector: 'consent-banner',
    waitForReady: waitForBannerReady,
    assert: async () => assertion(),
  })
}

describe('Consent Banner Selectors', () => {
  beforeEach(async () => {
    await withJsdomEnvironment(({ window }) => {
      window.sessionStorage.clear()
      window.localStorage.clear()
    })
  })

  it('returns consent modal wrapper with expected attributes', async () => {
    await renderConsentBanner(() => {
      const wrapper = getConsentWrapper()

      expect(wrapper.id).toBe('consent-modal-id')
      expect(wrapper.getAttribute('role')).toBe('dialog')
      expect(wrapper.getAttribute('aria-labelledby')).toBe('consent-modal__title')
    })
  })

  it('locates the close button', async () => {
    await renderConsentBanner(() => {
      const closeBtn = getConsentCloseBtn()

      expect(closeBtn).toBeTruthy()
      expect(closeBtn.classList.contains('consent-modal__close-btn')).toBe(true)
      expect(closeBtn.getAttribute('aria-label')).toMatch(/close cookie consent/i)
    })
  })

  it('locates the allow-all button', async () => {
    await renderConsentBanner(() => {
      const allowBtn = getConsentAllowBtn()

      expect(allowBtn).toBeTruthy()
      expect(allowBtn.classList.contains('consent-modal__btn-allow')).toBe(true)
      expect(allowBtn.textContent?.trim()).toBe('Allow All')
    })
  })

  it('locates the customize link', async () => {
    await renderConsentBanner(() => {
      const customizeLink = getConsentCustomizeLink()

      expect(customizeLink).toBeTruthy()
      expect(customizeLink.classList.contains('consent-modal__btn-customize')).toBe(true)
      expect(customizeLink.textContent?.trim()).toBe('Customize')
    })
  })

  it('throws a ClientScriptError when wrapper is missing', async () => {
    await renderConsentBanner(() => {
      document.getElementById('consent-modal-id')?.remove()

      expect(() => getConsentWrapper()).toThrowError(ClientScriptError)
    })
  })
})
