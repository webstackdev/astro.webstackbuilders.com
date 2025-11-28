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
  }): Promise<void> {
    const { listingPath, linkSelector, minSegments, notFoundMessage } = options
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

    const waitForLoad = this.waitForPageLoad()
    await this.navigateToPage(targetHref)
    await waitForLoad
  }

  async openFirstArticleDetail(): Promise<void> {
    await this.navigateToListingDetail({
      listingPath: '/articles',
      linkSelector: 'main a[href^="/articles/"]',
      minSegments: 2,
      notFoundMessage: 'Could not find article detail link on /articles',
    })
  }

  async openFirstServiceDetail(): Promise<void> {
    await this.navigateToListingDetail({
      listingPath: '/services',
      linkSelector: 'main a[href^="/services/"]',
      minSegments: 2,
      notFoundMessage: 'Could not find service detail link on /services',
    })
  }
}
