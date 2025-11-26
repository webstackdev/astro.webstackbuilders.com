// @vitest-environment node
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
  getNavMenuElement,
  getNavToggleBtnElement,
  getNavToggleWrapperElement,
  getNavWrapperElement,
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
      document.body.innerHTML = `<div></div>`
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
      document.body.innerHTML = `<div></div>`
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
      document.body.innerHTML = `<div></div>`
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
      document.body.innerHTML = `<nav class="main-nav" role="navigation"></nav>`
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
      document.body.innerHTML = `<nav class="main-nav" role="navigation"></nav>`
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
      document.body.innerHTML = `<nav class="main-nav" role="navigation"></nav>`
      expect(() => getNavToggleBtnElement()).toThrow()
    })
  })
})
