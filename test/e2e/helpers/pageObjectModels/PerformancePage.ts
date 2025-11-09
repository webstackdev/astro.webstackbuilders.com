/**
 * Performance Page Object Model
 * Methods for testing performance metrics and Core Web Vitals
 */
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from '@test/e2e/helpers'

export class PerformancePage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  /**
   * ================================================================
   * Core Web Vitals Methods
   * ================================================================
   */

  /**
   * Measure Largest Contentful Paint (LCP)
   * LCP measures loading performance - should be under 2.5s for good UX
   */
  async measureLCP(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          observer.disconnect()
          resolve(lastEntry?.startTime || 0)
        })
        observer.observe({ type: 'largest-contentful-paint', buffered: true })

        // Timeout after 10 seconds
        setTimeout(() => {
          observer.disconnect()
          resolve(0)
        }, 10000)
      })
    })
  }

  /**
   * Measure First Input Delay (FID) simulation
   * FID measures interactivity - should be under 100ms for good UX
   */
  async measureFID(): Promise<number> {
    // Wait for page to be fully interactive
    await this.page.waitForLoadState('networkidle')

    // Find a safe clickable element (not the cookie modal)
    const clickTarget = await this.page.evaluate(() => {
      // Try to find main content area or header
      const main = document.querySelector('main')
      const header = document.querySelector('header')

      return main ? 'main' : (header ? 'header' : 'body')
    })

    const startTime = Date.now()
    await this.page.click(clickTarget, { force: true })
    const endTime = Date.now()
    return endTime - startTime
  }

  /**
   * Measure Cumulative Layout Shift (CLS)
   * CLS measures visual stability - should be under 0.1 for good UX
   */
  async measureCLS(waitTime = 5000): Promise<number> {
    return await this.page.evaluate((timeout) => {
      return new Promise((resolve) => {
        let clsValue = 0

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // @ts-ignore - layout-shift is valid
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              // @ts-ignore
              clsValue += entry.value
            }
          }
        })

        observer.observe({ type: 'layout-shift', buffered: true })

        setTimeout(() => {
          observer.disconnect()
          resolve(clsValue)
        }, timeout)
      })
    }, waitTime)
  }

  /**
   * Measure Time to Interactive (TTI)
   * TTI measures when the page becomes fully interactive - should be under 3.8s
   */
  async measureTTI(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        if ('performance' in window && 'getEntriesByType' in performance) {
          const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          if (navTiming) {
            resolve(navTiming.domInteractive)
          }
        }
        resolve(0)
      })
    })
  }

  /**
   * Measure First Contentful Paint (FCP)
   * FCP measures when first content is painted - should be under 1.8s
   */
  async measureFCP(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint')
          if (fcpEntry) {
            observer.disconnect()
            resolve(fcpEntry.startTime)
          }
        })
        observer.observe({ type: 'paint', buffered: true })

        setTimeout(() => {
          observer.disconnect()
          resolve(0)
        }, 10000)
      })
    })
  }

  /**
   * Measure Total Blocking Time (TBT)
   * TBT measures sum of blocking time of long tasks - should be under 200ms
   */
  async measureTBT(waitTime = 5000): Promise<number> {
    return await this.page.evaluate((timeout) => {
      return new Promise((resolve) => {
        let totalBlockingTime = 0

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // @ts-ignore
            if (entry.duration > 50) {
              // @ts-ignore
              totalBlockingTime += entry.duration - 50
            }
          }
        })

        observer.observe({ type: 'longtask', buffered: true })

        setTimeout(() => {
          observer.disconnect()
          resolve(totalBlockingTime)
        }, timeout)
      })
    }, waitTime)
  }

  /**
   * Measure Speed Index (approximation)
   * Speed Index measures how quickly content is visually displayed - should be under 3.4s
   */
  async measureSpeedIndex(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navTiming) {
          const si = navTiming.domContentLoadedEventEnd - navTiming.fetchStart
          resolve(si)
        } else {
          resolve(0)
        }
      })
    })
  }

  /**
   * Measure page load time
   */
  async measurePageLoadTime(): Promise<number> {
    const startTime = Date.now()
    await this.waitForLoadState('load')
    const endTime = Date.now()
    return endTime - startTime
  }

  /**
   * ================================================================
   * Image Performance Methods
   * ================================================================
   */

  /**
   * Get all images on the page with their attributes
   */
  async getImageInfo(): Promise<Array<{
    src: string | null
    loading: string | null
    width: number
    height: number
  }>> {
    return await this.page.locator('img').evaluateAll((imgs) => {
      return imgs
        .filter((img): img is HTMLImageElement => img instanceof HTMLImageElement)
        .map((img) => {
          return {
            src: img.getAttribute('src'),
            loading: img.getAttribute('loading'),
            width: img.width,
            height: img.height,
          }
        })
    })
  }

  /**
   * Check if images use lazy loading
   */
  async hasLazyLoadedImages(): Promise<boolean> {
    const images = await this.getImageInfo()
    return images.some((img) => img.loading === 'lazy')
  }

  /**
   * Check if any images are oversized
   */
  async hasOversizedImages(maxWidth = 3000): Promise<boolean> {
    const images = await this.getImageInfo()
    return images.some((img) => img.width > maxWidth)
  }

  /**
   * ================================================================
   * Resource Loading Methods
   * ================================================================
   */

  /**
   * Count render-blocking stylesheets
   */
  async countRenderBlockingStylesheets(): Promise<number> {
    return await this.page.evaluate(() => {
      const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      const blocking = stylesheets.filter((link) => !link.hasAttribute('media'))
      return blocking.length
    })
  }

  /**
   * ================================================================
   * Assertion Methods
   * ================================================================
   */

  /**
   * Expect LCP to be under threshold (default: 2500ms for "good")
   */
  async expectLCPUnder(threshold = 2500): Promise<void> {
    const lcp = await this.measureLCP()
    expect(lcp).toBeLessThan(threshold)
  }

  /**
   * Expect FID to be under threshold (default: 100ms for "good")
   */
  async expectFIDUnder(threshold = 100): Promise<void> {
    const fid = await this.measureFID()
    expect(fid).toBeLessThan(threshold)
  }

  /**
   * Expect CLS to be under threshold (default: 0.1 for "good")
   */
  async expectCLSUnder(threshold = 0.1): Promise<void> {
    const cls = await this.measureCLS()
    expect(cls).toBeLessThan(threshold)
  }

  /**
   * Expect TTI to be under threshold (default: 3800ms for "good")
   */
  async expectTTIUnder(threshold = 3800): Promise<void> {
    const tti = await this.measureTTI()
    expect(tti).toBeLessThan(threshold)
  }

  /**
   * Expect FCP to be under threshold (default: 1800ms for "good")
   */
  async expectFCPUnder(threshold = 1800): Promise<void> {
    const fcp = await this.measureFCP()
    expect(fcp).toBeLessThan(threshold)
  }

  /**
   * Expect TBT to be under threshold (default: 200ms for "good")
   */
  async expectTBTUnder(threshold = 200): Promise<void> {
    const tbt = await this.measureTBT()
    expect(tbt).toBeLessThan(threshold)
  }

  /**
   * Expect Speed Index to be under threshold (default: 3400ms for "good")
   */
  async expectSpeedIndexUnder(threshold = 3400): Promise<void> {
    const si = await this.measureSpeedIndex()
    expect(si).toBeLessThan(threshold)
  }

  /**
   * Expect page load time to be under threshold
   */
  async expectPageLoadUnder(threshold = 3000): Promise<void> {
    const loadTime = await this.measurePageLoadTime()
    expect(loadTime).toBeLessThan(threshold)
  }

  /**
   * Expect images to use lazy loading
   */
  async expectLazyLoadedImages(): Promise<void> {
    const hasLazy = await this.hasLazyLoadedImages()
    expect(hasLazy).toBe(true)
  }

  /**
   * Expect no oversized images
   */
  async expectNoOversizedImages(maxWidth = 3000): Promise<void> {
    const images = await this.getImageInfo()
    for (const img of images) {
      if (img.width > 0) {
        expect(img.width).toBeLessThan(maxWidth)
      }
    }
  }

  /**
   * Expect minimal render-blocking resources
   */
  async expectMinimalRenderBlocking(maxBlocking = 5): Promise<void> {
    const blocking = await this.countRenderBlockingStylesheets()
    expect(blocking).toBeLessThan(maxBlocking)
  }
}
