/**
 * Breadcrumb-specific Page Object Model
 */
import type { Page } from '@playwright/test'
import { EvaluationError } from '@test/errors'
import { BasePage, setupTestPage } from '@test/e2e/helpers'

export class BreadCrumbPage extends BasePage {
  protected constructor(page: Page) {
    super(page)
  }

  static override async init(page: Page): Promise<BreadCrumbPage> {
    await this.setupPlaywrightGlobals(page)
    const instance = new BreadCrumbPage(page)
    await instance.onInit()
    return instance
  }

  async navigateToListingDetail(options: {
    listingPath: string
    linkSelector: string
    minSegments: number
    notFoundMessage: string
    navigationMode?: 'client' | 'fresh'
  }): Promise<void> {
    const {
      listingPath,
      linkSelector,
      minSegments,
      notFoundMessage,
      navigationMode = 'client',
    } = options
    await setupTestPage(this.page, listingPath)

    const targetHref = await this.evaluate(({ selector, segments }) => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>(selector))
      const candidate = anchors.find(anchor => {
        const href = anchor.getAttribute('href')
        if (!href || !href.startsWith('/')) {
          return false
        }
        const parts = href.split('/').filter(Boolean)
        return parts.length >= segments
      })
      return candidate?.getAttribute('href') ?? null
    }, { selector: linkSelector, segments: minSegments })

    if (!targetHref) {
      throw new EvaluationError(notFoundMessage)
    }

    if (navigationMode === 'fresh') {
      await this.goto(targetHref)
      return
    }

    const waitForLoad = this.waitForPageLoad({ requireNext: true })
    await this.click(`a[href="${targetHref}"]`)
    await waitForLoad
  }

  async openFirstArticleDetail(options?: { navigationMode?: 'client' | 'fresh' }): Promise<void> {
    await this.navigateToListingDetail({
      listingPath: '/articles',
      linkSelector: 'main a[href^="/articles/"]',
      minSegments: 2,
      notFoundMessage: 'Could not find article detail link on /articles',
      ...options,
    })
  }

  async openFirstServiceDetail(options?: { navigationMode?: 'client' | 'fresh' }): Promise<void> {
    await this.navigateToListingDetail({
      listingPath: '/services',
      linkSelector: 'main a[href^="/services/"]',
      minSegments: 2,
      notFoundMessage: 'Could not find service detail link on /services',
      ...options,
    })
  }

  async openFirstCaseStudyDetail(options?: { navigationMode?: 'client' | 'fresh' }): Promise<void> {
    await this.navigateToListingDetail({
      listingPath: '/case-studies',
      linkSelector: 'main a[href^="/case-studies/"]',
      minSegments: 2,
      notFoundMessage: 'Could not find case study detail link on /case-studies',
      ...options,
    })
  }
}
