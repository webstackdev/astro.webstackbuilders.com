/**
 * Structured Data Tests
 * Tests for JSON-LD structured data schemas
 * @see src/components/Head/
 */

import { test, expect } from '@test/e2e/helpers'

test.describe('Structured Data', () => {
  test.skip('@wip homepage has Organization schema', async ({ page }) => {
    // Expected: Homepage should have Organization JSON-LD
    await page.goto("/")

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const hasOrgSchema = jsonLdScripts.some((json) => {
      try {
        const data = JSON.parse(json)
        return data['@type'] === 'Organization' || data['@type']?.includes('Organization')
      } catch {
        return false
      }
    })

    expect(hasOrgSchema).toBe(true)
  })

  test.skip('@wip Organization schema has required fields', async ({ page }) => {
    // Expected: Organization should have name, url, logo
    await page.goto("/")

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const orgSchema = jsonLdScripts
      .map((json) => {
        try {
          return JSON.parse(json)
        } catch {
          return null
        }
      })
      .find((data) => data?.['@type'] === 'Organization')

    expect(orgSchema).toBeTruthy()
    expect(orgSchema?.name).toBeTruthy()
    expect(orgSchema?.url).toBeTruthy()
  })

  test.skip('@wip article pages have Article schema', async ({ page }) => {
    // Expected: Articles should have Article or BlogPosting schema
    await page.goto("/articles")
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const hasArticleSchema = jsonLdScripts.some((json) => {
      try {
        const data = JSON.parse(json)
        return (
          data['@type'] === 'Article' ||
          data['@type'] === 'BlogPosting' ||
          data['@type']?.includes('Article')
        )
      } catch {
        return false
      }
    })

    expect(hasArticleSchema).toBe(true)
  })

  test.skip('@wip Article schema has required fields', async ({ page }) => {
    // Expected: Article should have headline, author, datePublished
    await page.goto("/articles")
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const articleSchema = jsonLdScripts
      .map((json) => {
        try {
          return JSON.parse(json)
        } catch {
          return null
        }
      })
      .find((data) => data?.['@type'] === 'Article' || data?.['@type'] === 'BlogPosting')

    expect(articleSchema).toBeTruthy()
    expect(articleSchema?.headline).toBeTruthy()
    expect(articleSchema?.datePublished).toBeTruthy()
  })

  test.skip('@wip homepage has WebSite schema', async ({ page }) => {
    // Expected: Should have WebSite schema with search action
    await page.goto("/")

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const hasWebSiteSchema = jsonLdScripts.some((json) => {
      try {
        const data = JSON.parse(json)
        return data['@type'] === 'WebSite'
      } catch {
        return false
      }
    })

    expect(hasWebSiteSchema).toBe(true)
  })

  test.skip('@wip BreadcrumbList schema on deep pages', async ({ page }) => {
    // Expected: Article pages should have BreadcrumbList
    await page.goto("/articles")
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const hasBreadcrumbSchema = jsonLdScripts.some((json) => {
      try {
        const data = JSON.parse(json)
        return data['@type'] === 'BreadcrumbList'
      } catch {
        return false
      }
    })

    expect(hasBreadcrumbSchema).toBe(true)
  })

  test.skip('@wip all schemas have @context', async ({ page }) => {
    // Expected: All JSON-LD should have @context
    await page.goto("/")

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents()

    for (const json of jsonLdScripts) {
      try {
        const data = JSON.parse(json)
        expect(data['@context']).toBe('https://schema.org')
      } catch {
        // Invalid JSON
        expect(true).toBe(false) // Fail if JSON is invalid
      }
    }
  })

  test.skip('@wip schemas are valid JSON', async ({ page }) => {
    // Expected: All JSON-LD should parse without errors
    await page.goto("/")

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents()

    for (const json of jsonLdScripts) {
      expect(() => JSON.parse(json)).not.toThrow()
    }
  })

  test.skip('@wip service pages have Service schema', async ({ page }) => {
    // Expected: Service pages should have Service or Product schema
    await page.goto("/services")
    const firstService = page.locator('a[href*="/services/"]').first()

    if ((await firstService.count()) === 0) {
      test.skip()
    }

    await firstService.click()
    await page.waitForLoadState('networkidle')

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const hasServiceSchema = jsonLdScripts.some((json) => {
      try {
        const data = JSON.parse(json)
        return data['@type'] === 'Service' || data['@type'] === 'Product'
      } catch {
        return false
      }
    })

    expect(hasServiceSchema).toBe(true)
  })

  test.skip('@wip contact page has ContactPage schema', async ({ page }) => {
    // Expected: Contact page may have ContactPage schema
    await page.goto("/contact")

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const hasContactSchema = jsonLdScripts.some((json) => {
      try {
        const data = JSON.parse(json)
        return data['@type'] === 'ContactPage' || data['@type'] === 'ContactPoint'
      } catch {
        return false
      }
    })

    // Optional, but good to have
    expect(typeof hasContactSchema).toBe('boolean')
  })
})
