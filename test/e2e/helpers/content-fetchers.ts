/**
 * Content fetchers for E2E tests
 * Fetch content collection data at test runtime
 */
import type { Page } from '@playwright/test'

interface ArticleListItem {
  id: string
  title: string
}

interface ServiceListItem {
  id: string
  title: string
}

interface CaseStudyListItem {
  id: string
  title: string
}

interface TagListItem {
  name: string
}

/**
 * Fetch all published articles by scraping the articles index page
 */
export async function fetchArticles(page: Page): Promise<ArticleListItem[]> {
  await page.goto('/articles')

  // Extract article links from the page
  const articleLinks = await page.locator('a[href^="/articles/"]').evaluateAll((links) => {
    return links
      .map((link) => {
        const href = link.getAttribute('href')
        if (!href || href === '/articles' || href === '/articles/') return null

        const id = href.replace('/articles/', '').replace(/\/$/, '')
        const title = link.textContent?.trim() || id

        return { id, title }
      })
      .filter((item): item is ArticleListItem => item !== null)
  })

  // Deduplicate by id
  const uniqueArticles = Array.from(
    new Map(articleLinks.map((item) => [item.id, item])).values()
  )

  return uniqueArticles
}

/**
 * Fetch all services by scraping the services index page
 */
export async function fetchServices(page: Page): Promise<ServiceListItem[]> {
  await page.goto('/services')

  const serviceLinks = await page.locator('a[href^="/services/"]').evaluateAll((links) => {
    return links
      .map((link) => {
        const href = link.getAttribute('href')
        if (!href || href === '/services' || href === '/services/') return null

        const id = href.replace('/services/', '').replace(/\/$/, '')
        const title = link.textContent?.trim() || id

        return { id, title }
      })
      .filter((item): item is ServiceListItem => item !== null)
  })

  const uniqueServices = Array.from(
    new Map(serviceLinks.map((item) => [item.id, item])).values()
  )

  return uniqueServices
}

/**
 * Fetch all case studies by scraping the case studies index page
 */
export async function fetchCaseStudies(page: Page): Promise<CaseStudyListItem[]> {
  await page.goto('/case-studies')

  const caseStudyLinks = await page.locator('a[href^="/case-studies/"]').evaluateAll((links) => {
    return links
      .map((link) => {
        const href = link.getAttribute('href')
        if (!href || href === '/case-studies' || href === '/case-studies/') return null

        const id = href.replace('/case-studies/', '').replace(/\/$/, '')
        const title = link.textContent?.trim() || id

        return { id, title }
      })
      .filter((item): item is CaseStudyListItem => item !== null)
  })

  const uniqueCaseStudies = Array.from(
    new Map(caseStudyLinks.map((item) => [item.id, item])).values()
  )

  return uniqueCaseStudies
}

/**
 * Fetch all tags by scraping the tags index page
 */
export async function fetchTags(page: Page): Promise<TagListItem[]> {
  await page.goto('/tags')

  const tagLinks = await page.locator('a[href^="/tags/"]').evaluateAll((links) => {
    return links
      .map((link) => {
        const href = link.getAttribute('href')
        if (!href || href === '/tags' || href === '/tags/') return null

        const name = href.replace('/tags/', '').replace(/\/$/, '')

        return { name }
      })
      .filter((item): item is TagListItem => item !== null)
  })

  const uniqueTags = Array.from(
    new Map(tagLinks.map((item) => [item.name, item])).values()
  )

  return uniqueTags
}
