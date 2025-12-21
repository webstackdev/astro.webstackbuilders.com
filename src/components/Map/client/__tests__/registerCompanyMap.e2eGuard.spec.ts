// @vitest-environment jsdom
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@components/scripts/utils/environmentClient', () => {
  return {
    isE2eTest: () => {
      return typeof window !== 'undefined' && (window as unknown as { isPlaywrightControlled?: boolean }).isPlaywrightControlled === true
    },
    getGoogleMapsApiKey: () => 'test-google-maps-api-key',
  }
})

vi.mock('@components/scripts/errors', () => {
  return {
    addScriptBreadcrumb: vi.fn(),
  }
})

vi.mock('@components/scripts/errors/handler', () => {
  return {
    handleScriptError: vi.fn(),
  }
})

vi.mock('@googlemaps/extended-component-library/api_loader.js', () => {
  return {
    APILoader: {
      importLibrary: vi.fn(),
    },
  }
})

describe('Map registerCompanyMap', () => {
  beforeEach(() => {
    ;(window as unknown as { isPlaywrightControlled?: boolean }).isPlaywrightControlled = false
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
    ;(window as unknown as { isPlaywrightControlled?: boolean }).isPlaywrightControlled = false
    document.body.innerHTML = ''
  })

  test('skips initialization during Playwright E2E', async () => {
    ;(window as unknown as { isPlaywrightControlled?: boolean }).isPlaywrightControlled = true

    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

    const { registerCompanyMap } = await import('@components/Map/client')
    registerCompanyMap()

    expect(addEventListenerSpy).not.toHaveBeenCalled()

    const { APILoader } = await import('@googlemaps/extended-component-library/api_loader.js')
    expect(APILoader.importLibrary).not.toHaveBeenCalled()
  })
})
