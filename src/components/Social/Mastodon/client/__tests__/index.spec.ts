import { describe, expect, test, vi, beforeEach } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import MastodonFixture from '@components/Social/Mastodon/client/__fixtures__/index.fixture.astro'
import type { MastodonModalElement } from '@components/Social/Mastodon/client'
import { executeRender, withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  saveMastodonInstance,
  setCurrentMastodonInstance,
  getCurrentMastodonInstance,
  subscribeMastodonInstances,
} from '@components/scripts/store/mastodonInstances'
import { isMastodonInstance } from '@components/Social/Mastodon/client/detector'
import { buildShareUrl } from '@components/Social/Mastodon/client/config'

const savedInstanceSubscribers: Array<(_instances: Set<string>) => void> = []

vi.mock('focus-trap', () => {
  const activate = vi.fn()
  const deactivate = vi.fn()
  return {
    createFocusTrap: vi.fn(() => ({ activate, deactivate })),
  }
})

vi.mock('@components/scripts/errors', () => ({
  addScriptBreadcrumb: vi.fn(),
}))

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: vi.fn(),
}))

vi.mock('@components/scripts/store/mastodonInstances', () => ({
  saveMastodonInstance: vi.fn(),
  setCurrentMastodonInstance: vi.fn(),
  getCurrentMastodonInstance: vi.fn(),
  subscribeMastodonInstances: vi.fn((callback: (_instances: Set<string>) => void) => {
    savedInstanceSubscribers.push(callback)
    return () => {
      const index = savedInstanceSubscribers.indexOf(callback)
      if (index >= 0) {
        savedInstanceSubscribers.splice(index, 1)
      }
    }
  }),
}))

vi.mock('@components/Social/Mastodon/client/detector', () => ({
  isMastodonInstance: vi.fn(),
  getUrlDomain: vi.fn((value: string | URL) =>
    typeof value === 'string' ? value.replace(/^https?:\/\//, '') : value.host
  ),
  normalizeURL: vi.fn((value: string) => (value.startsWith('http') ? value : `https://${value}`)),
}))

vi.mock('@components/Social/Mastodon/client/config', () => ({
  buildShareUrl: vi.fn(
    (instance: string, text: string) => `https://${instance}/share?text=${encodeURIComponent(text)}`
  ),
  mastodonConfig: { endpoint: 'share', params: { text: 'text' } },
}))

const mockIsMastodonInstance = vi.mocked(isMastodonInstance)
const mockBuildShareUrl = vi.mocked(buildShareUrl)
const mockGetCurrentInstance = vi.mocked(getCurrentMastodonInstance)
const mockSaveInstance = vi.mocked(saveMastodonInstance)
const mockSetCurrentInstance = vi.mocked(setCurrentMastodonInstance)
const mockSubscribeInstances = vi.mocked(subscribeMastodonInstances)

const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0))

const renderModal = async (
  assertion: (_context: {
    element: MastodonModalElement
    window: Window & typeof globalThis
  }) => Promise<void>
) => {
  const container = await AstroContainer.create()

  await executeRender<WebComponentModule<MastodonModalElement>>({
    container,
    component: MastodonFixture,
    moduleSpecifier: '@components/Social/Mastodon/client/index',
    waitForReady: async element => {
      await element.updateComplete
    },
    assert: async ({ element, window }) => {
      await assertion({ element, window: window as Window & typeof globalThis })
    },
  })
}

describe('MastodonModalElement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    savedInstanceSubscribers.splice(0, savedInstanceSubscribers.length)
    mockIsMastodonInstance.mockResolvedValue(true)
    mockBuildShareUrl.mockReturnValue('https://mastodon.social/share?text=Test')
    mockGetCurrentInstance.mockReturnValue(undefined)
  })

  test('renders hidden modal by default', async () => {
    await renderModal(async ({ element }) => {
      const dialog = element.querySelector('[role="dialog"]') as HTMLElement | null
      expect(dialog?.hasAttribute('hidden')).toBe(true)
      expect(element.open).toBe(false)

      const labelledBy = dialog?.getAttribute('aria-labelledby')
      expect(labelledBy).toBe(`${element.modalId}-title`)
      expect(element.querySelector(`#${element.modalId}-title`)?.textContent).toContain(
        'Share to Mastodon'
      )

      const mastodonHeaderIcon = element.querySelector(
        '.modal-content .flex.items-center.gap-3 svg'
      ) as SVGElement | null
      expect(mastodonHeaderIcon).toBeTruthy()
      expect(mastodonHeaderIcon?.getAttribute('aria-hidden')).toBe('true')
      expect(mastodonHeaderIcon?.getAttribute('focusable')).toBe('false')

      const modalContent = element.querySelector('.modal-content') as HTMLDivElement | null
      const form = element.querySelector('#mastodon-share-form') as HTMLFormElement | null
      expect(modalContent?.className).toContain('bg-page-base')
      expect(form?.className).toContain('bg-page-base')

      const title = element.querySelector(`#${element.modalId}-title`) as HTMLHeadingElement | null
      expect(title?.className).toContain('text-content-inverse')

      const closeIcon = element.querySelector(
        'button[aria-label="Close modal"] svg'
      ) as SVGElement | null
      expect(closeIcon?.getAttribute('aria-hidden')).toBe('true')
      expect(closeIcon?.getAttribute('focusable')).toBe('false')

      const closeButton = element.querySelector(
        'button[aria-label="Close modal"]'
      ) as HTMLButtonElement | null
      expect(closeButton?.className).toContain('text-primary-inverse')
      expect(closeButton?.className).toContain('focus-visible:outline-none')
      expect(closeButton?.className).toContain('focus-visible:after:border-spotlight')
      expect(closeButton?.className).toContain('after:rounded-none')

      const shareText = element.querySelector('#share-text') as HTMLTextAreaElement | null
      expect(shareText?.readOnly).toBe(false)
      expect(shareText?.className).toContain('outline-none')
      expect(shareText?.className).toContain('focus-visible:outline-none')
      expect(shareText?.className).toContain('focus-visible:ring-0')
      expect(shareText?.className).toContain('focus-visible:shadow-none')

      const shareTextWrapper = shareText?.parentElement as HTMLDivElement | null
      expect(shareTextWrapper?.className).toContain('after:rounded-none')
      expect(shareTextWrapper?.className).toContain('after:border-transparent')

      const instanceInput = element.querySelector('#mastodon-instance') as HTMLInputElement | null
      expect(instanceInput?.getAttribute('aria-describedby')).toBe(
        `${element.modalId}-instance-hint`
      )
      const hint = element.querySelector(`#${element.modalId}-instance-hint`) as HTMLElement | null
      expect(hint?.textContent).toContain('Enter only the domain')

      const instanceWrapper = instanceInput?.closest('div') as HTMLDivElement | null
      expect(instanceInput?.className).toContain('focus-visible:outline-none')
      expect(instanceInput?.className).toContain('focus-visible:ring-0')
      expect(instanceInput?.className).toContain('focus-visible:shadow-none')
      expect(instanceWrapper?.className).toContain('after:rounded-none')
      expect(instanceWrapper?.className).toContain('after:border-transparent')
      expect(instanceWrapper?.className).not.toContain('after:border-spotlight')

      const rememberCheckbox = element.querySelector(
        '#remember-instance'
      ) as HTMLInputElement | null
      expect(rememberCheckbox?.className).toContain('focus-visible:outline-none')
      expect(rememberCheckbox?.className).toContain('focus-visible:after:border-spotlight')
      expect(rememberCheckbox?.className).toContain('after:rounded-none')

      const cancelButton = element.querySelector('button.modal-cancel') as HTMLButtonElement | null
      const shareButton = element.querySelector('button[type="submit"]') as HTMLButtonElement | null
      expect(cancelButton?.className).toContain('focus-visible:outline-none')
      expect(cancelButton?.className).toContain('focus-visible:after:border-spotlight')
      expect(cancelButton?.className).toContain('after:rounded-none')
      expect(shareButton?.className).toContain('focus-visible:outline-none')
      expect(shareButton?.className).toContain('focus-visible:after:border-spotlight')
      expect(shareButton?.className).toContain('after:rounded-none')
      expect(shareButton?.className).toContain('text-content-inverse')
    })
  })

  test('openModal shows modal and populates text', async () => {
    await renderModal(async ({ element, window }) => {
      element.openModal('Highlight text to share')
      await flushMicrotasks()

      const dialog = element.querySelector('[role="dialog"]') as HTMLElement | null
      const textarea = element.querySelector('#share-text') as HTMLTextAreaElement | null
      const instanceInput = element.querySelector('#mastodon-instance') as HTMLInputElement | null
      const instanceWrapper = instanceInput?.closest('div') as HTMLDivElement | null

      expect(dialog?.hasAttribute('hidden')).toBe(false)
      expect(textarea?.value.trim()).toBe('Highlight text to share')
      expect(window.document.activeElement).toBe(instanceInput)
      expect(instanceWrapper?.className).not.toContain('after:border-spotlight')
    })
  })

  test('allows editing the share text before submit', async () => {
    await renderModal(async ({ element, window }) => {
      element.openModal('Original share text')
      await flushMicrotasks()

      const textarea = element.querySelector('#share-text') as HTMLTextAreaElement | null
      expect(textarea).toBeTruthy()

      if (!textarea) {
        return
      }

      textarea.value = 'Edited share text'
      textarea.dispatchEvent(new window.Event('input', { bubbles: true }))

      expect(element.shareText).toBe('Edited share text')
    })
  })

  test('submits share request when instance is valid', async () => {
    await renderModal(async ({ element, window }) => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)

      element.openModal('Shareable quote')
      await flushMicrotasks()

      const input = element.querySelector('#mastodon-instance') as HTMLInputElement
      const textarea = element.querySelector('#share-text') as HTMLTextAreaElement
      input.value = 'mastodon.social'
      input.dispatchEvent(new window.Event('input', { bubbles: true }))
      textarea.value = 'Updated share copy'
      textarea.dispatchEvent(new window.Event('input', { bubbles: true }))

      const rememberCheckbox = element.querySelector('#remember-instance') as HTMLInputElement
      rememberCheckbox.checked = true
      rememberCheckbox.dispatchEvent(new window.Event('change', { bubbles: true }))

      const form = element.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))

      await flushMicrotasks()

      expect(mockIsMastodonInstance).toHaveBeenCalledWith('mastodon.social')
      expect(mockBuildShareUrl).toHaveBeenCalledWith('mastodon.social', 'Updated share copy')
      expect(mockSaveInstance).toHaveBeenCalled()
      expect(mockSetCurrentInstance).toHaveBeenCalledWith('mastodon.social')
      expect(openSpy).toHaveBeenCalledWith(
        'https://mastodon.social/share?text=Test',
        '_blank',
        'noopener,noreferrer'
      )
    })
  })

  test('shows error when domain is not Mastodon', async () => {
    mockIsMastodonInstance.mockResolvedValueOnce(false)

    await renderModal(async ({ element, window }) => {
      element.openModal('Share text')
      await flushMicrotasks()

      const input = element.querySelector('#mastodon-instance') as HTMLInputElement
      input.value = 'not-mastodon.example'
      input.dispatchEvent(new window.Event('input', { bubbles: true }))

      const form = element.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))

      await flushMicrotasks()

      const status = element.querySelector('.modal-status') as HTMLElement
      expect(status.textContent).toContain('does not appear')
      expect(status.getAttribute('role')).toBe('alert')
      expect(status.getAttribute('aria-live')).toBe('assertive')
      expect(mockSetCurrentInstance).not.toHaveBeenCalled()
    })
  })

  test('renders saved instances from store updates', async () => {
    await renderModal(async ({ element, window }) => {
      const subscriber = mockSubscribeInstances.mock.calls.at(0)?.[0]
      subscriber?.(new Set(['mastodon.social']))
      await flushMicrotasks()

      const savedButton = element.querySelector('.saved-instance') as HTMLButtonElement
      expect(savedButton?.textContent?.trim()).toBe('mastodon.social')

      savedButton?.dispatchEvent(new window.Event('click', { bubbles: true }))
      const input = element.querySelector('#mastodon-instance') as HTMLInputElement
      expect(input.value).toBe('mastodon.social')
    })
  })

  test('MastodonModal helper dispatches open events', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      const { MastodonModal } = await import('@components/Social/Mastodon/client/index')
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

      MastodonModal.openModal('Helper text')

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'mastodon:open-modal', detail: { text: 'Helper text' } })
      )

      dispatchSpy.mockRestore()
    })
  })
})
