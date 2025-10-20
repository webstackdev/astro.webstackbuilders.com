/**
 * Core Web Vitals Tests
 * Tests for Core Web Vitals metrics (LCP, FID, CLS)
 */

import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('Core Web Vitals', () => {
  test.skip('@wip Largest Contentful Paint under 2.5s', async ({ page }) => {
    // Expected: LCP should be under 2.5 seconds (good)
    await page.goto(TEST_URLS.home)

    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry?.startTime || 0)
        })
        observer.observe({ type: 'largest-contentful-paint', buffered: true })

        // Timeout after 10 seconds
        setTimeout(() => resolve(0), 10000)
      })
    })

    expect(lcp).toBeLessThan(2500)
  })

  test.skip('@wip First Input Delay simulation', async ({ page }) => {
    // Expected: Page should respond quickly to first interaction
    await page.goto(TEST_URLS.home)

    const startTime = Date.now()

    // Simulate first interaction
    await page.click('body')

    const endTime = Date.now()
    const delay = endTime - startTime

    // FID should be under 100ms (good)
    expect(delay).toBeLessThan(100)
  })

  test.skip('@wip Cumulative Layout Shift under 0.1', async ({ page }) => {
    // Expected: CLS should be under 0.1 (good)
    await page.goto(TEST_URLS.home)

    // Wait for page to settle
    await page.waitForTimeout(3000)

    const cls = await page.evaluate(() => {
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
        }, 5000)
      })
    })

    expect(cls).toBeLessThan(0.1)
  })

  test.skip('@wip Time to Interactive under 3.8s', async ({ page }) => {
    // Expected: TTI should be under 3.8s (good)
    await page.goto(TEST_URLS.home)

    const tti = await page.evaluate(() => {
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

    expect(tti).toBeLessThan(3800)
  })

  test.skip('@wip First Contentful Paint under 1.8s', async ({ page }) => {
    // Expected: FCP should be under 1.8s (good)
    await page.goto(TEST_URLS.home)

    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint')
          if (fcpEntry) {
            resolve(fcpEntry.startTime)
          }
        })
        observer.observe({ type: 'paint', buffered: true })

        setTimeout(() => resolve(0), 10000)
      })
    })

    expect(fcp).toBeLessThan(1800)
  })

  test.skip('@wip Total Blocking Time under 200ms', async ({ page }) => {
    // Expected: TBT should be under 200ms (good)
    await page.goto(TEST_URLS.home)

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    const tbt = await page.evaluate(() => {
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
        }, 5000)
      })
    })

    expect(tbt).toBeLessThan(200)
  })

  test.skip('@wip Speed Index under 3.4s', async ({ page }) => {
    // Expected: Speed Index should be under 3.4s (good)
    await page.goto(TEST_URLS.home)

    const speedIndex = await page.evaluate(() => {
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

    expect(speedIndex).toBeLessThan(3400)
  })

  test.skip('@wip page load time under 3s', async ({ page }) => {
    // Expected: Full page load should be under 3 seconds
    const startTime = Date.now()

    await page.goto(TEST_URLS.home)
    await page.waitForLoadState('load')

    const endTime = Date.now()
    const loadTime = endTime - startTime

    expect(loadTime).toBeLessThan(3000)
  })

  test.skip('@wip images load efficiently', async ({ page }) => {
    // Expected: Images should use modern formats and be optimized
    await page.goto(TEST_URLS.home)

    const images = await page.locator('img').evaluateAll((imgs) => {
      return imgs.map((img) => {
        const htmlImg = img as HTMLImageElement
        return {
          src: htmlImg.getAttribute('src'),
          loading: htmlImg.getAttribute('loading'),
          width: htmlImg.width,
          height: htmlImg.height,
        }
      })
    })

    // Check for lazy loading
    const hasLazyLoading = images.some((img) => img.loading === 'lazy')
    expect(hasLazyLoading).toBe(true)

    // Check for proper dimensions (no massive images)
    for (const img of images) {
      if (img.width > 0) {
        expect(img.width).toBeLessThan(3000)
      }
    }
  })

  test.skip('@wip no render-blocking resources', async ({ page }) => {
    // Expected: Critical resources should not block rendering
    await page.goto(TEST_URLS.home)

    const renderBlocking = await page.evaluate(() => {
      const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      const blocking = stylesheets.filter((link) => !link.hasAttribute('media'))
      return blocking.length
    })

    // Some blocking resources may be necessary, but should be minimal
    expect(renderBlocking).toBeLessThan(5)
  })
})
