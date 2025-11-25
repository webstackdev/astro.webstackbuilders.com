/**
 * Head Page Object Model
 * Provides helpers for validating metadata, JSON-LD schemas, and related assets
 */
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from '@test/e2e/helpers'
import { TestError } from '@test/errors'

export type JsonLdSchema = Record<string, unknown> & {
  '@type'?: string | string[]
}

export interface StructuredDataEntry<T extends JsonLdSchema = JsonLdSchema> {
  index: number
  schema: T
}

export interface AssetValidationResult {
  url: string
  status: number
  ok: boolean
}

export class HeadPage extends BasePage {
  protected constructor(page: Page) {
    super(page)
  }

  static override async init(page: Page): Promise<HeadPage> {
    await page.addInitScript(() => {
      window.isPlaywrightControlled = true
    })
    const instance = new HeadPage(page)
    await instance.onInit()
    return instance
  }

  /**
   * Collect and parse all JSON-LD structured data entries from the current page
   */
  async getStructuredDataEntries<T extends JsonLdSchema = JsonLdSchema>(): Promise<StructuredDataEntry<T>[]> {
    const scripts = await this.page
      .locator('script[type="application/ld+json"]')
      .evaluateAll(nodes => nodes.map(node => node.textContent ?? ''))

    const entries: StructuredDataEntry<T>[] = []

    scripts.forEach((content, index) => {
      if (!content.trim()) {
        return
      }

      try {
        const parsed = JSON.parse(content) as unknown
        const normalized = Array.isArray(parsed) ? parsed : [parsed]

        for (const schema of normalized) {
          if (schema && typeof schema === 'object') {
            entries.push({ index, schema: schema as T })
          }
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        throw new TestError(`Failed to parse JSON-LD script at index ${index}: ${reason}`)
      }
    })

    return entries
  }

  /**
   * Return all schema types present on the page
   */
  async getSchemaTypes(): Promise<string[]> {
    const entries = await this.getStructuredDataEntries()
    return entries
      .map(entry => entry.schema['@type'])
      .flatMap(value => {
        if (!value) {
          return []
        }
        return Array.isArray(value) ? value : [value]
      })
      .map(type => String(type))
  }

  /**
   * Assert that the required schema types are rendered
   */
  async expectSchemaTypes(requiredTypes: string[]): Promise<void> {
    const schemaTypes = await this.getSchemaTypes()
    for (const type of requiredTypes) {
      expect(schemaTypes).toContain(type)
    }
  }

  /**
   * Find the first schema that matches a specific `@type` value
   */
  async getSchemaByType<T extends JsonLdSchema = JsonLdSchema>(type: string): Promise<T | undefined> {
    const entries = await this.getStructuredDataEntries<T>()
    const match = entries.find(entry => this.schemaHasType(entry.schema, type))
    return match?.schema
  }

  /**
   * Get non-empty values for a specific field across all schemas
   */
  async getSchemaFieldValues(field: string): Promise<unknown[]> {
    const entries = await this.getStructuredDataEntries()
    return entries
      .map(entry => entry.schema[field])
      .filter((value): value is unknown => value !== undefined && value !== null)
  }

  /**
   * Gather distinct logo URLs defined within structured data
   */
  async getLogoUrls(): Promise<string[]> {
    const logos = await this.getSchemaFieldValues('logo')
    return [...new Set(
      logos.filter((value): value is string => typeof value === 'string')
    )]
  }

  /**
   * Ensure all structured data logos are absolute URLs and reachable
   */
  async expectLogosReachable(): Promise<void> {
    const logos = await this.getLogoUrls()
    for (const logo of logos) {
      expect(this.isAbsoluteUrl(logo), `Logo ${logo} should be an absolute URL`).toBe(true)
      await this.expectAssetReachable(logo)
    }
  }

  /**
   * Retrieve a meta tag content by its name attribute
   */
  async getMetaContentByName(name: string): Promise<string | null> {
    return await this.getMetaContentByAttribute('name', name)
  }

  /**
   * Retrieve a meta tag content by its property attribute
   */
  async getMetaContentByProperty(property: string): Promise<string | null> {
    return await this.getMetaContentByAttribute('property', property)
  }

  /**
   * Assert that a meta tag contains the expected content
   */
  async expectMetaContent(
    attribute: 'name' | 'property',
    value: string,
    expectedContent: string | RegExp,
  ): Promise<void> {
    const content = await this.getMetaContentByAttribute(attribute, value)
    expect(content, `Meta ${attribute}="${value}" should be present`).not.toBeNull()
    this.assertTextMatch(content as string, expectedContent)
  }

  /**
   * Get the href for a link tag with the provided rel attribute
   */
  async getLinkHref(rel: string): Promise<string | null> {
    return await this.page.evaluate(linkRel => {
      const link = document.head.querySelector(`link[rel="${linkRel}"]`)
      return link?.getAttribute('href') ?? null
    }, rel)
  }

  /**
   * Assert that the canonical URL matches the expected value
   */
  async expectCanonicalUrl(expected: string | RegExp): Promise<void> {
    const canonical = await this.getLinkHref('canonical')
    expect(canonical, 'Canonical link tag should exist').not.toBeNull()
    this.assertTextMatch(canonical as string, expected)
  }

  /**
   * Return the current document title
   */
  async getDocumentTitle(): Promise<string> {
    return await this.page.title()
  }

  /**
   * Assert that the document title matches the expected value
   */
  async expectDocumentTitle(expected: string | RegExp): Promise<void> {
    const title = await this.getDocumentTitle()
    this.assertTextMatch(title, expected)
  }

  /**
   * Validate that an asset resolves successfully
   */
  async validateAssetUrl(assetUrl: string): Promise<AssetValidationResult> {
    const resolvedUrl = this.resolveAssetUrl(assetUrl)
    const response = await this.page.request.get(resolvedUrl, { failOnStatusCode: false })
    return {
      url: resolvedUrl,
      status: response.status(),
      ok: response.status() >= 200 && response.status() < 400,
    }
  }

  /**
   * Expect an asset URL to return a successful status code
   */
  async expectAssetReachable(assetUrl: string): Promise<void> {
    const result = await this.validateAssetUrl(assetUrl)
    expect(result.ok, `Asset ${result.url} responded with status ${result.status}`).toBe(true)
  }

  private async getMetaContentByAttribute(attribute: 'name' | 'property', value: string): Promise<string | null> {
    return await this.page.evaluate(params => {
      const selector = `meta[${params.attribute}="${params.value}"]`
      const meta = document.head.querySelector(selector)
      return meta?.getAttribute('content') ?? null
    }, { attribute, value })
  }

  private schemaHasType(schema: JsonLdSchema, type: string): boolean {
    const schemaType = schema['@type']
    if (Array.isArray(schemaType)) {
      return schemaType.includes(type)
    }
    return schemaType === type
  }

  private assertTextMatch(value: string, expected: string | RegExp): void {
    if (typeof expected === 'string') {
      expect(value).toBe(expected)
    } else {
      expect(value).toMatch(expected)
    }
  }

  private resolveAssetUrl(assetUrl: string): string {
    try {
      return new URL(assetUrl).href
    } catch {
      return new URL(assetUrl, this.page.url()).href
    }
  }

  private isAbsoluteUrl(value: string): boolean {
    try {
      /* eslint-disable-next-line no-new */
      new URL(value)
      return true
    } catch {
      return false
    }
  }
}
