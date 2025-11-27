/**
 * Structured Data Tests
 * Tests for JSON-LD structured data schemas
 * @see src/components/Head/
 */

import { HeadPage, test, expect } from '@test/e2e/helpers'
import { TestError } from '@test/errors'
import type { JsonLdSchema } from '@test/e2e/helpers/pageObjectModels/HeadPage'

interface OrganizationSchema extends JsonLdSchema {
  name?: string
  url?: string
  logo?: string
  description?: string
}

interface ArticleSchema extends JsonLdSchema {
  headline?: string
  datePublished?: string
  dateModified?: string
  author?: { name?: string }
  url?: string
  image?: string | string[]
}

interface ServiceSchema extends JsonLdSchema {
  name?: string
  url?: string
}

interface ContactPageSchema extends JsonLdSchema {
  name?: string
  url?: string
}

const expectAbsoluteUrl = (value: unknown): void => {
  expect(typeof value).toBe('string')
  if (typeof value === 'string') {
    expect(() => new URL(value)).not.toThrow()
  }
}

const getFirstContentLink = async (page: HeadPage, selector: string): Promise<string> => {
  await page.waitForSelector(selector, { timeout: 5000 })
  const href = await page.evaluate(sel => {
    const element = document.querySelector(sel)
    return element?.getAttribute('href') ?? null
  }, selector)

  if (!href) {
    throw new TestError(`Unable to find href for selector: ${selector}`)
  }

  return href
}

test.describe('Structured Data', () => {
  test('@ready homepage renders Organization and WebSite schemas', async ({ page: playwrightPage }) => {
    const page = await HeadPage.init(playwrightPage)
    await page.goto('/')

    await page.expectSchemaTypes(['Organization', 'WebSite'])
  })

  test('@ready Organization schema exposes required fields', async ({ page: playwrightPage }) => {
    const page = await HeadPage.init(playwrightPage)
    await page.goto('/')

    const organization = await page.getSchemaByType<OrganizationSchema>('Organization')

    expect(organization).toBeDefined()
    expect(organization?.name).toBeTruthy()
    expect(organization?.url).toBeTruthy()
    expect(organization?.description).toBeTruthy()
    expect(organization?.logo).toBeTruthy()
    expectAbsoluteUrl(organization?.url)
    expectAbsoluteUrl(organization?.logo)
  })

  test('@ready structured data logos resolve to live assets', async ({ page: playwrightPage }) => {
    const page = await HeadPage.init(playwrightPage)
    await page.goto('/')

    await page.expectLogosReachable()
  })

  test('@ready article pages render Article schema with required fields', async ({ page: playwrightPage }) => {
    const page = await HeadPage.init(playwrightPage)
    await page.goto('/articles')

    const articleHref = await getFirstContentLink(page, 'a[href^="/articles/"]:not([href="/articles"])')
    await page.goto(articleHref)
    await page.waitForLoadState('networkidle')

    await page.expectSchemaTypes(['Article'])
    const article = await page.getSchemaByType<ArticleSchema>('Article')

    expect(article).toBeDefined()
    expect(article?.headline).toBeTruthy()
    expect(article?.datePublished).toBeTruthy()
    expect(article?.author?.name).toBeTruthy()
    expect(article?.url).toBeTruthy()
    expectAbsoluteUrl(article?.url)
    if (typeof article?.image === 'string') {
      expectAbsoluteUrl(article.image)
    }
  })

  test('@ready deep content pages include BreadcrumbList schema', async ({ page: playwrightPage }) => {
    const page = await HeadPage.init(playwrightPage)
    await page.goto('/articles')

    const articleHref = await getFirstContentLink(page, 'a[href^="/articles/"]:not([href="/articles"])')
    await page.goto(articleHref)
    await page.waitForLoadState('networkidle')

    await page.expectSchemaTypes(['Article', 'BreadcrumbList'])
  })

  test('@ready homepage WebSite schema references publisher logo', async ({ page: playwrightPage }) => {
    const page = await HeadPage.init(playwrightPage)
    await page.goto('/')

    const webSiteSchema = await page.getSchemaByType<JsonLdSchema>('WebSite')
    expect(webSiteSchema).toBeDefined()
    const publisher = webSiteSchema ? (webSiteSchema['publisher'] as JsonLdSchema | undefined) : undefined
    expect(publisher?.['name']).toBeTruthy()
    expectAbsoluteUrl(publisher?.['logo'] as string | undefined)
  })

  test('@ready all JSON-LD entries specify schema.org context', async ({ page: playwrightPage }) => {
    const page = await HeadPage.init(playwrightPage)
    await page.goto('/')

    const schemas = await page.getStructuredDataEntries()
    expect(schemas.length).toBeGreaterThan(0)
    schemas.forEach(entry => {
      expect(entry.schema['@context']).toBe('https://schema.org')
    })
  })

  test('@ready service detail pages expose Service schema', async ({ page: playwrightPage }) => {
    const page = await HeadPage.init(playwrightPage)
    await page.goto('/services')

    const serviceCount = await page.countElements('a[href^="/services/"]:not([href="/services"])')
    if (serviceCount === 0) {
      test.skip()
    }

    const serviceHref = await getFirstContentLink(page, 'a[href^="/services/"]:not([href="/services"])')
    await page.goto(serviceHref)
    await page.waitForLoadState('networkidle')

    await page.expectSchemaTypes(['Service'])
    const service = await page.getSchemaByType<ServiceSchema>('Service')
    expect(service).toBeDefined()
    expect(service?.name).toBeTruthy()
    expect(service?.url).toBeTruthy()
    expectAbsoluteUrl(service?.url)
  })

  test('@ready contact page renders ContactPage schema', async ({ page: playwrightPage }) => {
    const page = await HeadPage.init(playwrightPage)
    await page.goto('/contact')

    await page.expectSchemaTypes(['ContactPage'])
    const contactPage = await page.getSchemaByType<ContactPageSchema>('ContactPage')
    expect(contactPage).toBeDefined()
    expect(contactPage?.name).toBeTruthy()
    expect(contactPage?.url).toBeTruthy()
    expectAbsoluteUrl(contactPage?.url)
  })
})
