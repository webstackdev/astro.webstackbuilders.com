import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

import TroubleshooterFixture from '@components/Troubleshooter/__fixtures__/index.fixture.astro'

describe('Troubleshooter (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('renders a named region with labelled troubleshooting sections', async () => {
    const renderedHtml = await container.renderToString(TroubleshooterFixture)

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const region = window.document.querySelector('section[role="region"][aria-label="Troubleshooting"]')
      expect(region).toBeTruthy()

      const visibleHeading = region?.querySelector('h3')
      expect(visibleHeading?.textContent).toContain('Verification failed in CI')

      const sectionHeadings = Array.from(region?.querySelectorAll('section[aria-labelledby] h4') ?? [])
      expect(sectionHeadings.map(heading => heading.textContent?.trim())).toEqual([
        'Symptoms',
        'Cause',
        'Diagnosis',
        'Fix',
      ])

      const icons = Array.from(region?.querySelectorAll('section[aria-labelledby] svg') ?? [])
      expect(icons.length).toBeGreaterThan(0)

      icons.forEach(icon => {
        expect(icon.getAttribute('aria-hidden')).toBe('true')
        expect(icon.getAttribute('focusable')).toBe('false')
      })

      const diagnosisList = region?.querySelectorAll('ul')[0]
      expect(diagnosisList?.className).toContain('list-none')

      const marker = diagnosisList?.querySelector('li span[aria-hidden="true"]')
      expect(marker).toBeTruthy()
    })
  })
})