// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Time (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('renders a <relative-time> element and keeps slot fallback content', async () => {
    const Time = (await import('@components/Time/index.astro')).default

    const renderedHtml = await container.renderToString(Time, {
      props: {
        format: 'relative',
        datetime: '2020-01-01T00:00:00Z',
      },
      slots: {
        default: 'Fallback text',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const element = window.document.querySelector('relative-time')
      expect(element).toBeTruthy()
      expect(element?.getAttribute('datetime')).toBe('2020-01-01T00:00:00Z')
      expect(element?.textContent).toContain('Fallback text')
    })
  })

  test('serializes Date datetime to ISO string', async () => {
    const Time = (await import('@components/Time/index.astro')).default
    const date = new Date('2024-02-29T12:34:56.000Z')

    const renderedHtml = await container.renderToString(Time, {
      props: {
        format: 'datetime',
        datetime: date,
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const element = window.document.querySelector('relative-time')
      expect(element?.getAttribute('datetime')).toBe('2024-02-29T12:34:56.000Z')
    })
  })

  test('uses current time when now=true and datetime is omitted', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-02T03:04:05.000Z'))

    try {
      const Time = (await import('@components/Time/index.astro')).default

      const renderedHtml = await container.renderToString(Time, {
        props: {
          format: 'relative',
          now: true,
        },
      })

      await withJsdomEnvironment(async ({ window }) => {
        window.document.body.innerHTML = renderedHtml

        const element = window.document.querySelector('relative-time')
        expect(element?.getAttribute('datetime')).toBe('2030-01-02T03:04:05.000Z')
      })
    } finally {
      vi.useRealTimers()
    }
  })

  test('maps formatStyle and timeZoneName to kebab-case attributes', async () => {
    const Time = (await import('@components/Time/index.astro')).default

    const renderedHtml = await container.renderToString(Time, {
      props: {
        format: 'datetime',
        datetime: '2020-01-01T00:00:00Z',
        formatStyle: 'short',
        timeZoneName: 'shortOffset',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const element = window.document.querySelector('relative-time')
      expect(element?.getAttribute('format-style')).toBe('short')
      expect(element?.getAttribute('time-zone-name')).toBe('shortOffset')
    })
  })

  test('passes through supported attributes to <relative-time>', async () => {
    const Time = (await import('@components/Time/index.astro')).default

    const renderedHtml = await container.renderToString(Time, {
      props: {
        format: 'relative',
        datetime: '2020-01-01T00:00:00Z',
        tense: 'past',
        precision: 'day',
        threshold: 'P1D',
        prefix: 'about',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const element = window.document.querySelector('relative-time')
      expect(element?.getAttribute('format')).toBe('relative')
      expect(element?.getAttribute('tense')).toBe('past')
      expect(element?.getAttribute('precision')).toBe('day')
      expect(element?.getAttribute('threshold')).toBe('P1D')
      expect(element?.getAttribute('prefix')).toBe('about')
    })
  })
})
