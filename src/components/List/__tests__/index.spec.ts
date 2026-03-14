import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

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
})