import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ImageFixture from '@components/Image/client/__fixtures__/index.fixture.astro'
import type { ImageElement as ImageElementInstance } from '@components/Image/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type ImageModule = WebComponentModule<ImageElementInstance>

const getMainImage = (element: ImageElementInstance): HTMLImageElement | null =>
  element.querySelector('[data-image-figure] img')

const getFigure = (element: ImageElementInstance): HTMLElement | null =>
  element.querySelector('[data-image-figure]')

const getOpenButton = (element: ImageElementInstance): HTMLButtonElement | null =>
  element.querySelector('[data-image-open]')

const getDialog = (element: ImageElementInstance): HTMLElement | null =>
  element.querySelector('[data-image-dialog]')

const getModalImage = (element: ImageElementInstance): HTMLImageElement | null =>
  element.querySelector('[data-image-modal-asset]')

describe('Image web component', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const renderImage = async (
    props: {
      alt?: string
      variant?: 'left' | 'right' | 'center' | 'full'
      size?: '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs'
      magnifyButtonPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
    },
    assertion: (_context: {
      element: ImageElementInstance
      window: Window & typeof globalThis
    }) => Promise<void> | void
  ) => {
    await executeRender<ImageModule>({
      container,
      component: ImageFixture,
      moduleSpecifier: '@components/Image/client/index',
      args: { props },
      waitForReady: async element => {
        await element.updateComplete
      },
      assert: async ({ element, window }) => {
        await assertion({ element, window: window as Window & typeof globalThis })
      },
    })
  }

  const renderImageToString = (props: {
    alt?: string
    variant?: 'left' | 'right' | 'center' | 'full'
    size?: '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs' | 'invalid'
    magnifyButtonPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  }) => {
    return container.renderToString(ImageFixture, {
      props,
    })
  }

  test('renders centered image markup by default', async () => {
    await renderImage({}, async ({ element }) => {
      expect(element.getAttribute('data-image-variant')).toBe('center')

      const mainImage = getMainImage(element)
      expect(mainImage?.getAttribute('alt')).toBe('Backstage background test image')

      const openButton = getOpenButton(element)
      expect(openButton?.getAttribute('aria-label')).toContain('Backstage background test image')

      const dialog = getDialog(element)
      expect(dialog?.hasAttribute('hidden')).toBe(true)
    })
  })

  test('applies the requested magnify button corner', async () => {
    await renderImage({ magnifyButtonPosition: 'bottom-left' }, async ({ element }) => {
      const openButton = getOpenButton(element)
      expect(openButton?.getAttribute('data-image-open-position')).toBe('bottom-left')
      expect(openButton?.className).toContain('left-2')
      expect(openButton?.className).toContain('bottom-2')
    })
  })

  test('applies the requested desktop size token to centered images', async () => {
    await renderImage({ size: 'xl' }, async ({ element }) => {
      const figure = getFigure(element)
      expect(figure?.className).toContain('md:max-w-xl')

      const mainImage = getMainImage(element)
      expect(mainImage?.getAttribute('sizes')).toBe('(min-width: 768px) 36rem, 100vw')
    })
  })

  test('opens the modal when the magnify button is activated', async () => {
    await renderImage({ variant: 'right' }, async ({ element, window }) => {
      expect(element.getAttribute('data-image-variant')).toBe('right')

      const openButton = getOpenButton(element)
      openButton?.dispatchEvent(new window.Event('click', { bubbles: true }))
      await element.updateComplete

      const dialog = getDialog(element)
      expect(dialog?.hasAttribute('hidden')).toBe(false)
      expect(dialog?.getAttribute('aria-label')).toContain('Backstage background test image')

      const modalImage = getModalImage(element)
      expect(modalImage?.getAttribute('alt')).toBe('Backstage background test image')

      const closeIcon = element.querySelector(
        'button[aria-label="Close image dialog"] svg'
      ) as SVGElement | null
      expect(closeIcon?.getAttribute('aria-hidden')).toBe('true')
      expect(closeIcon?.getAttribute('focusable')).toBe('false')
    })
  })

  test('closes the modal on Escape', async () => {
    await renderImage({}, async ({ element, window }) => {
      const openButton = getOpenButton(element)
      openButton?.dispatchEvent(new window.Event('click', { bubbles: true }))
      await element.updateComplete

      window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }))
      await element.updateComplete

      const dialog = getDialog(element)
      expect(dialog?.hasAttribute('hidden')).toBe(true)
    })
  })

  test('throws for an invalid size value', async () => {
    await expect(renderImageToString({ size: 'invalid' })).rejects.toThrow(
      'Image: invalid size "invalid". Expected one of: 3xl, 2xl, xl, lg, md, sm, xs'
    )
  })

  test('throws when size is used with the full variant', async () => {
    await expect(renderImageToString({ variant: 'full', size: 'lg' })).rejects.toThrow(
      'Image: size cannot be used with variant "full". The "full" variant always renders at the full available container width on desktop. Use variant "center", "left", or "right" if you want to control the image max width with size.'
    )
  })
})
