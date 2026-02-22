import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Button (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('renders a disabled href-button without href/onclick and with aria-disabled', async () => {
    const Button = (await import('@components/Button/index.astro')).default

    const renderedHtml = await container.renderToString(Button, {
      props: {
        href: '/example',
        disabled: true,
        text: 'Example',
        onClick: 'alert("should not run")',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const link = window.document.querySelector('a')
      expect(link).toBeTruthy()
      expect(link?.getAttribute('aria-disabled')).toBe('true')
      expect(link?.getAttribute('tabindex')).toBe('-1')
      expect(link?.hasAttribute('href')).toBe(false)
      expect(link?.hasAttribute('onclick')).toBe(false)
    })
  })

  test('requires ariaLabel for icon-only buttons', async () => {
    const Button = (await import('@components/Button/index.astro')).default

    await expect(
      container.renderToString(Button, {
        props: {
          variant: 'primary',
          icon: 'close',
          iconPosition: 'only',
        },
      })
    ).rejects.toThrow('Button: icon-only buttons must provide ariaLabel')
  })

  test('renders icon-only button with explicit ariaLabel', async () => {
    const Button = (await import('@components/Button/index.astro')).default

    const renderedHtml = await container.renderToString(Button, {
      props: {
        variant: 'primary',
        icon: 'close',
        iconPosition: 'only',
        ariaLabel: 'Close dialog',
        type: 'button',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const button = window.document.querySelector('button')
      expect(button).toBeTruthy()
      expect(button?.getAttribute('aria-label')).toBe('Close dialog')
    })
  })
})
