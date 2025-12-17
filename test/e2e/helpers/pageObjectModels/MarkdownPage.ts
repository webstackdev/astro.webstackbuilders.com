/**
 * Markdown Page Object Model
 * Encapsulates locators and helper methods for the /testing/markdown fixture.
 */

import { type Locator, type Page } from '@playwright/test'
import { BasePage } from '@test/e2e/helpers'

export class MarkdownPage extends BasePage {
  private readonly fixturePath = '/testing/markdown'

  protected constructor(page: Page) {
    super(page)
  }

  static override async init(page: Page): Promise<MarkdownPage> {
    await this.setupPlaywrightGlobals(page)
    const instance = new MarkdownPage(page)
    await instance.onInit()
    return instance
  }

  async gotoFixture(): Promise<void> {
    await this.goto(this.fixturePath)
  }

  get article(): Locator {
    return this.page.locator('article[aria-labelledby="article-title"]').first()
  }

  get articleTitle(): Locator {
    return this.article.locator('#article-title').first()
  }

  get prose(): Locator {
    return this.page.locator('.markdown-content__prose').first()
  }

  heading(name: string, level?: number): Locator {
    return this.page.getByRole('heading', { name, ...(level ? { level } : {}) })
  }

  get footnoteRef(): Locator {
    return this.prose.locator('a[data-footnote-ref], a[href^="#user-content-fn-"], a[href^="#fn-"]').first()
  }

  get footnotesSection(): Locator {
    return this.prose.locator('section[data-footnotes], .footnotes').first()
  }

  footnoteDefinitionById(id: string): Locator {
    return this.prose.locator(`[id="${id}"]`).first()
  }

  async getFootnoteTargetIdFromHref(): Promise<string | null> {
    const targetHref = await this.footnoteRef.getAttribute('href')
    if (!targetHref) return null
    return targetHref.startsWith('#') ? targetHref.slice(1) : targetHref
  }
}
