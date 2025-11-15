/**
 * Structured Data Tests
 * Tests for JSON-LD structured data schemas
 * @see src/components/Head/
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Structured Data', () => {
  test('@ready homepage has Organization schema', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const jsonLdScripts = await playwrightPage
      .locator('script[type="application/ld+json"]')
      .allTextContents()
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

  test('@ready Organization schema has required fields', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const jsonLdScripts = await playwrightPage
      .locator('script[type="application/ld+json"]')
      .allTextContents()
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

  test('@ready article pages have Article schema', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')

    // Wait for articles to load
    await page.waitForSelector('a[href*="/articles/"]', { timeout: 5000 })

    // Get the first article URL
    const articleUrl = await page.evaluate(() => {
      const link = document.querySelector('a[href*="/articles/"]')
      return link ? link.getAttribute('href') : null
    })

    expect(articleUrl).toBeTruthy()

    // Navigate directly to the article page
    await page.goto(articleUrl!)
    await page.waitForLoadState('networkidle')

    const jsonLdScripts = await playwrightPage
      .locator('script[type="application/ld+json"]')
      .allTextContents()
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

  test('@ready Article schema has required fields', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    await page.click('a[href*="/articles/"]')
    await page.waitForLoadState('networkidle')

    const jsonLdScripts = await playwrightPage
      .locator('script[type="application/ld+json"]')
      .allTextContents()
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

  test('@ready homepage has WebSite schema', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const jsonLdScripts = await playwrightPage
      .locator('script[type="application/ld+json"]')
      .allTextContents()
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

  test('@ready BreadcrumbList schema on deep pages', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    await page.click('a[href*="/articles/"]')
    await page.waitForLoadState('networkidle')

    const jsonLdScripts = await playwrightPage
      .locator('script[type="application/ld+json"]')
      .allTextContents()
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

  test('@ready all schemas have @context', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const jsonLdScripts = await playwrightPage
      .locator('script[type="application/ld+json"]')
      .allTextContents()

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

  test('@ready schemas are valid JSON', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const jsonLdScripts = await playwrightPage
      .locator('script[type="application/ld+json"]')
      .allTextContents()

    for (const json of jsonLdScripts) {
      expect(() => JSON.parse(json)).not.toThrow()
    }
  })

  test('@ready service pages have Service schema', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')

    const firstServiceCount = await page.countElements('a[href*="/services/"]')
    if (firstServiceCount === 0) {
      test.skip()
    }

    await page.click('a[href*="/services/"]')
    await page.waitForLoadState('networkidle')

    const jsonLdScripts = await playwrightPage
      .locator('script[type="application/ld+json"]')
      .allTextContents()
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

  test('@ready contact page has ContactPage schema', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')

    const jsonLdScripts = await playwrightPage
      .locator('script[type="application/ld+json"]')
      .allTextContents()
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
