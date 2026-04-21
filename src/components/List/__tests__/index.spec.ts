import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import MixedApiFixture from '@components/List/__fixtures__/mixedApi.fixture.astro'
import RichItemsFixture from '@components/List/__fixtures__/richItems.fixture.astro'

describe('List (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('renders the chat-bubbles variant as question and answer definition pairs', async () => {
    const List = (await import('@components/List/index.astro')).default

    const renderedHtml = await container.renderToString(List, {
      props: {
        variant: 'chat-bubbles',
        size: '2xl',
        items: [
          {
            lead: 'Why did the system go down?',
            text: 'Because a config change broke it.',
          },
          {
            lead: 'Why did the config change break it?',
            text: 'Because the engineer made a mistake.',
          },
        ],
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const definitionList = window.document.querySelector('dl')
      expect(definitionList).toBeTruthy()
      expect(definitionList?.className).toContain('max-w-2xl')
      expect(definitionList?.className).toContain('mx-auto')

      const questions = window.document.querySelectorAll('dt')
      const answers = window.document.querySelectorAll('dd')

      expect(questions).toHaveLength(2)
      expect(answers).toHaveLength(2)
      expect(questions[0]?.textContent).toContain('Q:')
      expect(questions[0]?.textContent).toContain('Why did the system go down?')
      expect(answers[0]?.textContent).toContain('A:')
      expect(answers[0]?.textContent).toContain('Because a config change broke it.')
      expect(answers[0]?.className).toContain('bg-secondary')
    })
  })

  test('throws for an invalid chat-bubbles size', async () => {
    const List = (await import('@components/List/index.astro')).default

    await expect(
      container.renderToString(List, {
        props: {
          variant: 'chat-bubbles',
          size: '3xl',
          items: [
            {
              lead: 'Why did the system go down?',
              text: 'Because a config change broke it.',
            },
          ],
        },
      })
    ).rejects.toThrow('ChatBubbles: invalid size "3xl". Expected one of: lg, xl, 2xl.')
  })

  test('starts numbering at the provided startNumber and applies the provided color for the numbered-with-background-list variant', async () => {
    const List = (await import('@components/List/index.astro')).default

    const renderedHtml = await container.renderToString(List, {
      props: {
        variant: 'numbered-with-background-list',
        color: 'info',
        startNumber: 4,
        items: [
          {
            lead: 'Step one',
            text: 'First item.',
          },
          {
            lead: 'Step two',
            text: 'Second item.',
          },
        ],
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const badges = Array.from(window.document.querySelectorAll('li > span:first-child'))
      const leads = Array.from(window.document.querySelectorAll('li em'))

      expect(badges).toHaveLength(2)
      expect(leads).toHaveLength(2)
      expect(badges[0]?.textContent?.trim()).toBe('4')
      expect(badges[1]?.textContent?.trim()).toBe('5')
      expect(badges[0]?.getAttribute('style')).toContain('background-color: var(--color-info);')
      expect(leads[0]?.getAttribute('style')).toContain('color: var(--color-info);')
    })
  })

  test('uses the default marker color for numbered-with-background-list when no color is provided', async () => {
    const List = (await import('@components/List/index.astro')).default

    const renderedHtml = await container.renderToString(List, {
      props: {
        variant: 'numbered-with-background-list',
        items: [
          {
            lead: 'Default step',
            text: 'Uses the default marker color.',
          },
        ],
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const badge = window.document.querySelector('li > span:first-child')
      const lead = window.document.querySelector('li em')

      expect(badge?.className).toContain('bg-primary-offset')
      expect(lead?.className).toContain('text-primary-offset')
      expect(badge?.getAttribute('style')).toBeNull()
      expect(lead?.getAttribute('style')).toBeNull()
    })
  })

  test('applies interactive card styling for the card-grid-list variant', async () => {
    const List = (await import('@components/List/index.astro')).default

    const renderedHtml = await container.renderToString(List, {
      props: {
        variant: 'card-grid-list',
        items: [
          {
            lead: 'Owner clarity matters.',
            text: 'Each card should clearly communicate its primary action.',
          },
        ],
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const card = window.document.querySelector('ul li')
      const lead = window.document.querySelector('ul li em')

      expect(card).toBeTruthy()
      expect(card?.className).toContain('hover:-translate-y-1')
      expect(card?.className).toContain('hover:bg-page-base')
      expect(card?.className).toContain('hover:shadow-md')
      expect(card?.className).toContain('focus-within:border-primary')
      expect(lead?.textContent).toContain('Owner clarity matters.')
    })
  })

  test('stacks lead and text vertically for the colored-marker-list variant', async () => {
    const List = (await import('@components/List/index.astro')).default

    const renderedHtml = await container.renderToString(List, {
      props: {
        variant: 'colored-marker-list',
        items: [
          {
            lead: 'Compatibility adapters',
            text: 'Provide a translation layer during migration.',
            color: 'bg-success',
          },
        ],
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const listItem = window.document.querySelector('ul li')
      const marker = window.document.querySelector('ul li > span:first-child')
      const contentWrapper = window.document.querySelector('ul li > div')
      const lead = window.document.querySelector('ul li em')
      const text = window.document.querySelector('ul li div > span')

      expect(listItem).toBeTruthy()
      expect(marker?.className).toContain('bg-success')
      expect(contentWrapper?.className).toContain('flex-col')
      expect(contentWrapper?.className).not.toContain('sm:flex-row')
      expect(contentWrapper?.className).toContain('items-start')
      expect(contentWrapper?.className).toContain('gap-1')
      expect(lead?.className).not.toContain('sm:mr-2')
      expect(lead?.textContent).toContain('Compatibility adapters')
      expect(text?.textContent).toContain('Provide a translation layer during migration.')
    })
  })

  test('renders the experience-list variant with compact chevron markers', async () => {
    const List = (await import('@components/List/index.astro')).default

    const renderedHtml = await container.renderToString(List, {
      props: {
        variant: 'experience-list',
        items: [
          {
            text: 'Built self-service infrastructure provisioning workflows.',
          },
        ],
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const list = window.document.querySelector('ul')
      const item = window.document.querySelector('ul li')
      const svg = window.document.querySelector('ul li svg')

      expect(list?.className).toContain('space-y-2')
      expect(list?.className).toContain('text-content-offset')
      expect(item?.className).toContain('flex')
      expect(svg).toBeTruthy()
      expect(item?.textContent).toContain(
        'Built self-service infrastructure provisioning workflows.'
      )
    })
  })

  test('applies hover styling for the three-column-icon-list variant', async () => {
    const List = (await import('@components/List/index.astro')).default

    const renderedHtml = await container.renderToString(List, {
      props: {
        variant: 'three-column-icon-list',
        items: [
          {
            title: 'Resource metrics',
            text: 'Built-in via Metrics Server.',
            icon: 'graph',
            color: 'page-inverse',
            bgColor: 'info-inverse',
          },
        ],
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const card = window.document.querySelector('ul li')
      const title = window.document.querySelector('ul li h3')

      expect(card).toBeTruthy()
      expect(card?.className).toContain('transition-all')
      expect(card?.className).toContain('duration-200')
      expect(card?.className).toContain('hover:-translate-y-1')
      expect(card?.className).toContain('hover:shadow-lg')
      expect(title?.textContent).toContain('Resource metrics')
    })
  })

  test('renders rich ListItem children through the existing layout item API', async () => {
    const renderedHtml = await container.renderToString(RichItemsFixture)

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const items = Array.from(window.document.querySelectorAll('ul > li'))
      expect(items).toHaveLength(2)
      expect(items[0]?.querySelector('em')?.textContent).toContain('Network isolation')
      expect(items[0]?.querySelector('sup[data-footnote-ref="slot-demo"]')?.textContent).toBe('1')
      expect(items[1]?.textContent).toContain('Dedicated node pools reduce resource contention.')
      expect(window.document.querySelector('wsb-list-item')).toBeNull()
    })
  })

  test('throws a BuildError when items and ListItem children are both provided', async () => {
    await expect(container.renderToString(MixedApiFixture)).rejects.toThrow(
      'List: received both the `items` prop and ListItem children. Use one API or the other.'
    )
  })
})
