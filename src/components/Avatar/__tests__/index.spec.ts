import type { ImageMetadata } from 'astro'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

const fixtureModules = import.meta.glob('../server/__fixtures__/avatars/*.{webp,jpg,png}', {
  eager: true,
  import: 'default',
}) as Record<string, ImageMetadata>

const mockLoadAvatarModules = vi.fn(() => fixtureModules)

vi.mock('@components/Avatar/server/avatarImports', () => ({
  loadAvatarModules: mockLoadAvatarModules,
}))

describe('Avatar (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    mockLoadAvatarModules.mockClear()
    vi.resetModules()

    container = await AstroContainer.create()
  })

  test('renders an image avatar with alt equal to the name', async () => {
    const Avatar = (await import('@components/Avatar/index.astro')).default

    const renderedHtml = await container.renderToString(Avatar, {
      props: {
        name: 'Kevin Brown',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const img = window.document.querySelector('img')
      expect(img).toBeTruthy()
      expect(img?.getAttribute('alt')).toBe('Kevin Brown')
    })
  })

  test('renders an initials fallback that is still labeled by name', async () => {
    const Avatar = (await import('@components/Avatar/index.astro')).default

    const renderedHtml = await container.renderToString(Avatar, {
      props: {
        name: 'Jane Doe',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const placeholder = window.document.querySelector('.avatar-placeholder')
      expect(placeholder).toBeTruthy()
      expect(placeholder?.getAttribute('role')).toBe('img')
      expect(placeholder?.getAttribute('aria-label')).toBe('Jane Doe')

      const initials = placeholder?.querySelector('span')
      expect(initials?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  test('renders a lead avatar at 40x40 when lead=true', async () => {
    const Avatar = (await import('@components/Avatar/index.astro')).default

    const renderedHtml = await container.renderToString(Avatar, {
      props: {
        name: 'Jane Doe',
        lead: true,
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const containerEl = window.document.querySelector('.avatar-container')
      expect(containerEl).toBeTruthy()
      expect(containerEl?.getAttribute('class')).toContain('w-10')
      expect(containerEl?.getAttribute('class')).toContain('h-10')
      expect(containerEl?.getAttribute('class')).toContain('rounded-full')

      const placeholder = window.document.querySelector('.avatar-placeholder')
      expect(placeholder).toBeTruthy()
      expect(placeholder?.getAttribute('class')).toContain('w-10')
      expect(placeholder?.getAttribute('class')).toContain('h-10')
    })
  })
})
