import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SelectorsFixture from '@components/Social/Highlighter/client/__fixtures__/selectors.fixture.astro'
import {
  getBodyElement,
  getDivElement,
  getDivElements,
  getHtmlElement,
  getSlotElement,
  queryAllDocument,
  queryDocument,
} from '../selectors'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import { ClientScriptError } from '@components/scripts/errors'

describe('Highlighter selector utilities', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const renderFixtureHtml = (props?: Record<string, unknown>) =>
    container.renderToString(SelectorsFixture, props ? { props } : undefined)

  const withRenderedFixture = async (
    assertion: (_context: { window: Window & typeof globalThis }) => Promise<void> | void,
    props?: Record<string, unknown>,
  ): Promise<void> => {
    const renderedHtml = await renderFixtureHtml(props)
    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml
      await assertion({ window })
    })
  }

  test('queryDocument returns matching element', async () => {
    await withRenderedFixture(() => {
      const element = queryDocument('#primary-content')
      expect(element.id).toBe('primary-content')
    })
  })

  test('queryDocument throws when selector misses', async () => {
    await withRenderedFixture(() => {
      expect(() => queryDocument('#missing')).toThrow(ClientScriptError)
    })
  })

  test('queryAllDocument returns node list', async () => {
    await withRenderedFixture(() => {
      const elements = queryAllDocument('.multi-div')
      expect(elements.length).toBe(2)
    })
  })

  test('queryAllDocument throws for empty results', async () => {
    await withRenderedFixture(() => {
      expect(() => queryAllDocument('.nope')).toThrow(ClientScriptError)
    })
  })

  test('getDivElement returns HTMLDivElement', async () => {
    await withRenderedFixture(() => {
      const div = getDivElement('#primary-content')
      expect(div).toBeInstanceOf(HTMLDivElement)
    })
  })

  test('getDivElement throws when element is missing', async () => {
    await withRenderedFixture(() => {
      expect(() => getDivElement('#not-a-div')).toThrow(ClientScriptError)
    })
  })

  test('getDivElements returns a list of divs', async () => {
    await withRenderedFixture(() => {
      const divs = getDivElements('.multi-div')
      expect(Array.from(divs).every((element) => element instanceof HTMLDivElement)).toBe(true)
    })
  })

  test('getDivElements throws when no divs exist', async () => {
    await withRenderedFixture(() => {
      expect(() => getDivElements('.missing-divs')).toThrow(ClientScriptError)
    })
  })

  test('getBodyElement and getHtmlElement return structural nodes', async () => {
    await withRenderedFixture(({ window }) => {
      expect(getBodyElement()).toBe(window.document.body)
      expect(getHtmlElement()).toBe(window.document.documentElement)
    })
  })

  test('getSlotElement returns slot inside shadow root', async () => {
    await withRenderedFixture(({ window }) => {
      const host = window.document.createElement('div')
      const shadowRoot = host.attachShadow({ mode: 'open' })
      shadowRoot.innerHTML = '<slot></slot>'

      const slot = getSlotElement(shadowRoot)
      expect(slot).toBeInstanceOf(window.HTMLSlotElement)
    })
  })

  test('getSlotElement throws when slot is missing', async () => {
    await withRenderedFixture(() => {
      const host = document.createElement('div')
      const shadowRoot = host.attachShadow({ mode: 'open' })
      expect(() => getSlotElement(shadowRoot)).toThrow(ClientScriptError)
    })
  })
})
