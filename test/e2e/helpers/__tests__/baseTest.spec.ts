import { describe, expect, it, vi } from 'vitest'
import fixtureData from '@test/e2e/helpers/__fixtures__/pages.json'

// Mock the pages.json import
vi.mock('@cache/pages.json', () => ({
  default: fixtureData,
}))

// Import after mocking
const { sitePaths } = await import('@test/e2e/helpers/baseTest')

describe('baseTest helpers', () => {
  describe('sitePaths.articles', () => {
    it('should extract article paths', () => {
      expect(sitePaths.articles).toMatchInlineSnapshot(`
        [
          "/articles/test-article",
          "/articles/typescript-best-practices",
          "/articles/useful-vs-code-extensions",
          "/articles/writing-library-code",
        ]
      `)
    })
  })

  describe('sitePaths.caseStudies', () => {
    it('should extract case-studies paths', () => {
      expect(sitePaths.caseStudies).toMatchInlineSnapshot(`
        [
          "/case-studies/division-15",
          "/case-studies/ecommerce-modernization",
          "/case-studies/english-first",
          "/case-studies/enterprise-api-platform",
          "/case-studies/labcorp",
          "/case-studies/us-logistics",
        ]
      `)
    })
  })

  describe('sitePaths.services', () => {
    it('should extract services paths', () => {
      expect(sitePaths.services).toMatchInlineSnapshot(`
        [
          "/services/create-custom-font-sets",
          "/services/overview",
        ]
      `)
    })
  })

  describe('sitePaths.tags', () => {
    it('should extract tags paths', () => {
      expect(sitePaths.tags).toMatchInlineSnapshot(`
        [
          "/tags/apiDesign",
          "/tags/cms",
          "/tags/code",
          "/tags/crm",
          "/tags/graphql",
          "/tags/online-learning",
          "/tags/react",
          "/tags/services",
          "/tags/typescript",
        ]
      `)
    })
  })

  describe('sitePaths.downloads', () => {
    it('should extract downloads paths', () => {
      expect(sitePaths.downloads).toMatchInlineSnapshot(`
        [
          "/downloads/api-tool-consolidation-whitepaper",
          "/downloads/identity-security-for-dummies",
          "/downloads/lakehouse-analytics-guide",
          "/downloads/observability-benefits-guide",
          "/downloads/ransomware-recovery-kit",
        ]
      `)
    })
  })

  describe('sitePaths.socialShares', () => {
    it('should extract social-shares paths', () => {
      expect(sitePaths.socialShares).toMatchInlineSnapshot(`
        [
          "/social-shares/template",
        ]
      `)
    })
  })

  it('should extract all single-page paths', () => {
    expect(sitePaths.singlePages).toMatchInlineSnapshot(`
      [
        "/about",
        "/articles",
        "/case-studies",
        "/contact",
        "/cookies",
        "/downloads",
        "/offline",
        "/privacy",
        "/services",
        "/social-shares",
        "/tags",
      ]
    `)
  })

  it('should extract all  pages', () => {
    expect(sitePaths.allPages).toMatchInlineSnapshot(`
      [
        "/articles/test-article",
        "/articles/typescript-best-practices",
        "/articles/useful-vs-code-extensions",
        "/articles/writing-library-code",
        "/case-studies/division-15",
        "/case-studies/ecommerce-modernization",
        "/case-studies/english-first",
        "/case-studies/enterprise-api-platform",
        "/case-studies/labcorp",
        "/case-studies/us-logistics",
        "/services/create-custom-font-sets",
        "/services/overview",
        "/tags/apiDesign",
        "/tags/cms",
        "/tags/code",
        "/tags/crm",
        "/tags/graphql",
        "/tags/online-learning",
        "/tags/react",
        "/tags/services",
        "/tags/typescript",
        "/downloads/api-tool-consolidation-whitepaper",
        "/downloads/identity-security-for-dummies",
        "/downloads/lakehouse-analytics-guide",
        "/downloads/observability-benefits-guide",
        "/downloads/ransomware-recovery-kit",
        "/social-shares/template",
        "/about",
        "/articles",
        "/case-studies",
        "/contact",
        "/cookies",
        "/downloads",
        "/offline",
        "/privacy",
        "/services",
        "/social-shares",
        "/tags",
        "/non-existent-page",
      ]
    `)
  })
})
