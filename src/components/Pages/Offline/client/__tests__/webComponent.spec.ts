import { beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import OfflinePageComponent from '@components/Pages/Offline/index.astro'
import type { OfflinePageClientElement } from '../webComponent'
import { getSafeReturnToUrl } from '../url'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type OfflinePageModule = WebComponentModule<OfflinePageClientElement>

describe('getSafeReturnToUrl', () => {
  test('returns same-origin route from returnTo query param', () => {
    const result = getSafeReturnToUrl('?returnTo=%2Fcontact', 'http://localhost')

    expect(result).toBe('http://localhost/contact')
  })

  test('rejects external and offline returnTo values', () => {
    const externalResult = getSafeReturnToUrl(
      '?returnTo=https%3A%2F%2Fevil.example%2Fphish',
      'http://localhost'
    )
    const offlineResult = getSafeReturnToUrl('?returnTo=%2Foffline', 'http://localhost')

    expect(externalResult).toBeNull()
    expect(offlineResult).toBeNull()
  })
})

describe('OfflinePageClientElement class behavior', () => {
  let container: AstroContainer

  const renderArgs = {
    props: {
      content: {
        title: 'Offline',
        message: 'You are currently offline',
        items: {
          label: 'What you can still do',
          cards: [
            {
              title: 'Read cached pages',
              description: 'Visit pages loaded earlier',
              icon: 'document',
              color: 'primary-offset',
              inverseColor: 'content-inverse',
            },
          ],
        },
        about: {
          heading: 'About us',
          items: [
            { stat: '10+', area: 'Years' },
            { stat: '100+', area: 'Projects' },
            { stat: '24/7', area: 'Support' },
          ],
        },
        close: 'Get in touch',
        retryText: 'Try again',
      },
    },
  }

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const runComponentRender = async (
    assertion: (_context: {
      element: OfflinePageClientElement
      window: Window & typeof globalThis
    }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<OfflinePageModule>({
      container,
      component: OfflinePageComponent,
      moduleSpecifier: '@components/Pages/Offline/client/webComponent',
      args: renderArgs,
      waitForReady: async element => {
        await element.updateComplete
      },
      assert: async ({ element, module, renderResult, window }) => {
        expect(renderResult).toContain(`<${module.registeredName}`)
        if (!window) {
          return
        }

        await assertion({ element, window })
      },
    })
  }

  test('redirects to safe returnTo when retry is clicked', async () => {
    await runComponentRender(async ({ element, window }) => {
      const retryButton = window.document.getElementById('offline-retry-button')
      expect(retryButton).toBeInstanceOf(HTMLButtonElement)

      const assignSpy = vi.fn()
      const reloadSpy = vi.fn()
      element.assignNavigation = assignSpy
      element.reloadPage = reloadSpy

      window.history.replaceState({}, '', '/offline?returnTo=%2Fprivacy')
      ;(retryButton as HTMLButtonElement).click()

      expect(assignSpy).toHaveBeenCalledWith('http://localhost/privacy')
      expect(reloadSpy).not.toHaveBeenCalled()
    })
  })

  test('reloads when returnTo is missing or unsafe', async () => {
    await runComponentRender(async ({ element, window }) => {
      const retryButton = window.document.getElementById('offline-retry-button')
      expect(retryButton).toBeInstanceOf(HTMLButtonElement)

      const assignSpy = vi.fn()
      const reloadSpy = vi.fn()
      element.assignNavigation = assignSpy
      element.reloadPage = reloadSpy

      window.history.replaceState({}, '', '/offline?returnTo=https%3A%2F%2Fevil.example%2Fbad')
      ;(retryButton as HTMLButtonElement).click()

      expect(assignSpy).not.toHaveBeenCalled()
      expect(reloadSpy).toHaveBeenCalledTimes(1)
    })
  })
})
