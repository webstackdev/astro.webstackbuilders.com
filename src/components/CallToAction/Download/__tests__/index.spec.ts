import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'
import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

type DownloadFixture = {
  directDownloadUrl: string
  resource: string
}

const getDownloadResource = (download: CollectionEntry<'downloads'>): string | null => {
  const normalizedFilePath = download.filePath?.replace(/\\/g, '/')
  const filePathMatch = normalizedFilePath?.match(/\/articles\/(.+)\/download\.[^/.]+$/)

  if (filePathMatch?.[1]) {
    return filePathMatch[1]
  }

  const normalizedId = download.id.replace(/\\/g, '/')
  const idWithoutDownloadSuffix = normalizedId.replace(/\/download$/, '')
  return idWithoutDownloadSuffix.split('/')[0] ?? null
}

const getDownloadFixture = async (): Promise<DownloadFixture | null> => {
  const [download] = await getCollection('downloads')

  if (!download) {
    return null
  }

  const resource = getDownloadResource(download)
  const fileName = download.data.fileName?.trim()

  if (!resource || !fileName) {
    return null
  }

  return {
    directDownloadUrl: `/downloads/${fileName}`,
    resource,
  }
}

const downloadFixture = await getDownloadFixture()
const existingDownloadTest = downloadFixture ? test : test.skip

describe('Download CallToAction (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('labels the section and hides decorative svgs', async () => {
    const Download = (await import('@components/CallToAction/Download/index.astro')).default

    const renderedHtml = await container.renderToString(Download, {
      props: {
        resource: 'example-resource',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const host = window.document.querySelector('download-cta')
      const section = window.document.querySelector('section')
      expect(host).toBeTruthy()
      expect(section).toBeTruthy()
      expect(section?.getAttribute('aria-labelledby')).toBe('download-cta-title')
      expect(section?.getAttribute('aria-describedby')).toBe('download-cta-description')

      expect(window.document.getElementById('download-cta-title')?.tagName).toBe('H2')
      expect(window.document.getElementById('download-cta-description')?.tagName).toBe('P')

      const svgs = window.document.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
      svgs.forEach(svg => {
        expect(svg.getAttribute('aria-hidden')).toBe('true')
        expect(svg.getAttribute('focusable')).toBe('false')
      })
    })
  })

  existingDownloadTest('renders direct and landing download URLs for the web component host', async () => {
    if (!downloadFixture) {
      throw new Error('Expected an existing download fixture')
    }

    const Download = (await import('@components/CallToAction/Download/index.astro')).default

    const renderedHtml = await container.renderToString(Download, {
      props: {
        resource: downloadFixture.resource,
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const host = window.document.querySelector('download-cta')
      const primaryLink = window.document.querySelector('[data-download-cta-primary]')

      expect(host?.getAttribute('data-landing-url')).toBe(
        `/downloads/${downloadFixture.resource}`
      )
      expect(host?.getAttribute('data-direct-download-url')).toBe(
        downloadFixture.directDownloadUrl
      )
      expect(primaryLink?.getAttribute('href')).toBe(`/downloads/${downloadFixture.resource}`)
    })
  })

  test('supports a custom id base for aria relationships', async () => {
    const Download = (await import('@components/CallToAction/Download/index.astro')).default

    const renderedHtml = await container.renderToString(Download, {
      props: {
        id: 'custom-download',
        resource: 'example-resource',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const section = window.document.querySelector('section')
      expect(section?.getAttribute('aria-labelledby')).toBe('custom-download-title')
      expect(section?.getAttribute('aria-describedby')).toBe('custom-download-description')

      expect(window.document.getElementById('custom-download-title')).toBeTruthy()
      expect(window.document.getElementById('custom-download-description')).toBeTruthy()
    })
  })

  test('throws BuildError when resource is blank', async () => {
    const Download = (await import('@components/CallToAction/Download/index.astro')).default

    await expect(
      container.renderToString(Download, {
        props: {
          resource: '   ',
        } as any,
      })
    ).rejects.toMatchObject({
      name: 'BuildError',
    })
  })
})
