import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import {
  isButtonElement,
  isDivElement,
  isHeaderElement,
  isSpanElement,
  isUlElement,
} from '@components/scripts/assertions/elements'
import {
  getHeaderElement,
  getMobileSplashElement,
  getMobileNavFocusContainer,
  getNavMenuElement,
  getNavToggleBtnElement,
  getNavToggleWrapperElement,
  getNavWrapperElement,
  queryNavLinks,
} from '@components/Navigation/client/selectors'
import TestNavigationComponent from '@components/Navigation/client/__tests__/TestNavigation.astro'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type NavigationComponent = HTMLElementTagNameMap['site-navigation']
type NavigationComponentModule = WebComponentModule<NavigationComponent>

let container: AstroContainer

beforeEach(async () => {
  container = await AstroContainer.create()
})

const renderNavigationDom = async (
  assertion: (_context: { element: NavigationComponent }) => Promise<void> | void,
) => {
  await executeRender<NavigationComponentModule>({
    container,
    component: TestNavigationComponent,
    moduleSpecifier: '@components/Navigation/client/index',
    waitForReady: async (element) => {
      await element.updateComplete
    },
    assert: async ({ element }) => {
      await assertion({ element })
    },
  })
}

describe('getHeaderElement selector works', () => {
  test(' works with element in DOM', async () => {
    await renderNavigationDom(async () => {
      const sut = isHeaderElement(getHeaderElement())
      expect(sut).toBeTruthy()
    })
  })

  test(' throws with no results selected against DOM', async () => {
    await renderNavigationDom(async () => {
      getHeaderElement().remove()
      expect(() => getHeaderElement()).toThrow()
    })
  })
})

describe('getMobileSplashElement selector works', () => {
  test(' works with element in DOM', async () => {
    await renderNavigationDom(async () => {
      const sut = isDivElement(getMobileSplashElement())
      expect(sut).toBeTruthy()
    })
  })

  test(' throws with no results selected against DOM', async () => {
    await renderNavigationDom(async () => {
      getMobileSplashElement().remove()
      expect(() => getMobileSplashElement()).toThrow()
    })
  })
})

describe('getNavWrapperElement selector works', () => {
  test(' works with element in DOM', async () => {
    await renderNavigationDom(async () => {
      const sut = isSpanElement(getNavWrapperElement())
      expect(sut).toBeTruthy()
    })
  })

  test(' throws with no results selected against DOM', async () => {
    await renderNavigationDom(async () => {
      getNavWrapperElement().remove()
      expect(() => getNavWrapperElement()).toThrow()
    })
  })
})

describe('getNavMenuElement selector works', () => {
  test('getNavElement works with element in DOM', async () => {
    await renderNavigationDom(async () => {
      const sut = getNavMenuElement()
      expect(isUlElement(sut)).toBeTruthy()
    })
  })

  test('getNavElement throws with no results selected against DOM', async () => {
    await renderNavigationDom(async () => {
      getNavMenuElement().remove()
      expect(() => getNavMenuElement()).toThrow()
    })
  })
})

describe('getNavToggleWrapperElement selector works', () => {
  test('getNavToggleWrapperElement works with element in DOM', async () => {
    await renderNavigationDom(async () => {
      const sut = getNavToggleWrapperElement()
      expect(isSpanElement(sut)).toBeTruthy()
    })
  })

  test('getNavToggleWrapperElement throws with no results selected against DOM', async () => {
    await renderNavigationDom(async () => {
      getNavToggleWrapperElement().remove()
      expect(() => getNavToggleWrapperElement()).toThrow()
    })
  })
})

describe('getNavToggleBtnElement selector works', () => {
  test('getNavToggleBtnElement works with element in DOM', async () => {
    await renderNavigationDom(async () => {
      const sut = getNavToggleBtnElement()
      expect(isButtonElement(sut)).toBeTruthy()
    })
  })

  test('getNavToggleBtnElement throws with no <slot> elements in the shadow DOM', async () => {
    await renderNavigationDom(async () => {
      getNavToggleBtnElement().remove()
      expect(() => getNavToggleBtnElement()).toThrow()
    })
  })
})

describe('Navigation selectors stay in sync with layout', () => {
  test('finds all required elements and at least one nav link', async () => {
    await renderNavigationDom(async () => {
      expect(isHeaderElement(getHeaderElement()), 'Navigation should render within a real #header element').toBeTruthy()
      expect(isDivElement(getMobileSplashElement()), 'Header should render a #mobile-splash backdrop element').toBeTruthy()
      expect(
        isDivElement(getMobileNavFocusContainer()),
        'Navigation should render a #mobile-nav-focus-container focus trap container',
      ).toBeTruthy()

      const menu = getNavMenuElement()
      const links = queryNavLinks(menu)

      expect(links.length, 'Navigation menu should include at least one anchor link').toBeGreaterThan(0)
      expect(
        links.every((link) => Boolean(link.getAttribute('href'))),
        'All navigation links discovered via selectors should have an href attribute',
      ).toBe(true)
    })
  })
})
