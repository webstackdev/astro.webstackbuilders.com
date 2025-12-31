/**
 * Performance Page Object Model
 * Methods for testing performance metrics and Core Web Vitals
 */
import type { Page } from '@playwright/test'
import type { Config } from 'lighthouse'
import { createServer } from 'net'
import { playAudit } from 'playwright-lighthouse'
import { BasePage } from '@test/e2e/helpers'

export type LighthouseThresholds = Record<string, number>

const defaultThresholds: LighthouseThresholds = {
  performance: 80,
  accessibility: 70,
  'best-practices': 70,
  seo: 70,
}

export interface LighthouseAuditOptions {
  port: number
  reportName: string
  directory: string
  config?: Config
  thresholds?: LighthouseThresholds
  ignoreError?: boolean
}

export class LighthousePage extends BasePage {
  protected constructor(page: Page) {
    super(page)
  }

  /**
   * Finds a free port for Chromium remote debugging.
   */
  static async getFreePort(): Promise<number> {
    const server = createServer()

    return await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, () => {
        const address = server.address()
        server.close(() => {
          if (!address || typeof address === 'string') {
            reject(new Error('Failed to acquire a free port'))
            return
          }

          resolve(address.port)
        })
      })
    })
  }

  static override async init(page: Page): Promise<LighthousePage> {
    await this.setupPlaywrightGlobals(page)
    const instance = new LighthousePage(page)
    await instance.onInit()
    return instance
  }

  async runDesktopAudit(options: LighthouseAuditOptions): Promise<void> {
    const reportSuffix = Date.now()

    const auditConfig = {
      page: this.page,
      port: options.port,
      thresholds: options.thresholds ?? defaultThresholds,
      ignoreError: options.ignoreError ?? false,
      reports: {
        formats: {
          json: false,
          html: true,
          csv: false,
        },
        name: `${options.reportName}-${reportSuffix}`,
        directory: options.directory,
      },
      ...(options.config ? { config: options.config } : {}),
    }

    await playAudit(auditConfig)
  }
}
