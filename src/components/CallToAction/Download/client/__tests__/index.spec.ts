import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import {
  __resetEmailCollectionForTests,
  markEmailCollected,
} from '@components/scripts/store/emailCollection'

let renderDownloadCta: typeof import('./testUtils').renderDownloadCta

beforeAll(async () => {
  ;({ renderDownloadCta } = await import('./testUtils'))
})

describe('download-cta web component', () => {
  afterEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    __resetEmailCollectionForTests()
  })

  it('uses the download landing page link until an email has been collected', async () => {
    await renderDownloadCta(async ({ elements, urls }) => {
      expect(elements.host.dataset['emailState']).toBe('gated')
      expect(elements.primaryLink.getAttribute('href')).toBe(urls.landingUrl)
    })
  })

  it('switches the primary link to the direct download after email collection', async () => {
    await renderDownloadCta(async ({ elements, urls }) => {
      expect(elements.primaryLink.getAttribute('href')).toBe(urls.landingUrl)

      markEmailCollected('reader@example.com', 'newsletter_form')
      await Promise.resolve()

      expect(elements.host.dataset['emailState']).toBe('ready')
      expect(elements.primaryLink.getAttribute('href')).toBe(urls.directDownloadUrl)
    })
  })
})
