/**
 * Component Rendering Visual Tests
 * Visual regression tests for individual components
 */

import { test, expect } from '@test/e2e/helpers'

test.describe('Component Visual Rendering', () => {
  test.skip('@blocked navigation component visual', async ({ page }) => {
    // Blocked by: Need visual regression testing setup
    // Expected: Navigation should render consistently
    await page.goto("/")

    // TODO: Visual testing
    // await percySnapshot(page, 'Component - Navigation')
  })

  test.skip('@blocked footer component visual', async ({ page }) => {
    // Blocked by: Need visual regression testing setup
    // Expected: Footer should render consistently
    await page.goto("/")

    // TODO: Visual testing
    // await percySnapshot(page, 'Component - Footer')
  })

  test.skip('@blocked carousel component visual', async ({ page }) => {
    // Blocked by: Need visual regression testing setup
    // Expected: Carousel should render consistently
    await page.goto("/")

    const carousel = page.locator('[data-carousel]').first()
    await carousel.scrollIntoViewIfNeeded()

    // TODO: Visual testing
    // await percySnapshot(page, 'Component - Carousel')
  })

  test.skip('@blocked contact form component visual', async ({ page }) => {
    // Blocked by: Need visual regression testing setup
    // Expected: Contact form should render consistently
    await page.goto("/contact")

    // TODO: Visual testing
    // await percySnapshot(page, 'Component - Contact Form')
  })

  test.skip('@blocked newsletter form component visual', async ({ page }) => {
    // Blocked by: Need visual regression testing setup
    // Expected: Newsletter form should render consistently
    await page.goto("/")

    const newsletter = page.locator('[data-newsletter-form]').first()
    await newsletter.scrollIntoViewIfNeeded()

    // TODO: Visual testing
    // await percySnapshot(page, 'Component - Newsletter Form')
  })

  test.skip('@blocked theme picker component visual', async ({ page }) => {
    // Blocked by: Need visual regression testing setup
    // Expected: Theme picker should render consistently
    await page.goto("/")

    // TODO: Visual testing
    // await percySnapshot(page, 'Component - Theme Picker')
  })

  test.skip('@blocked cookie consent component visual', async ({ page }) => {
    // Blocked by: Need visual regression testing setup
    // Expected: Cookie banner should render consistently
    await page.goto("/")

    const cookieBanner = page.locator('[data-cookie-consent]')
    if (await cookieBanner.isVisible()) {
      // TODO: Visual testing
      // await percySnapshot(page, 'Component - Cookie Consent')
    }
  })

  test.skip('@blocked article card component visual', async ({ page }) => {
    // Blocked by: Need visual regression testing setup
    // Expected: Article cards should render consistently
    await page.goto("/articles")

    // TODO: Visual testing
    // await percySnapshot(page, 'Component - Article Card')
  })

  test.skip('@blocked testimonial component visual', async ({ page }) => {
    // Blocked by: Need visual regression testing setup
    // Expected: Testimonial should render consistently
    await page.goto("/")

    const testimonial = page.locator('[data-testimonials]').first()
    await testimonial.scrollIntoViewIfNeeded()

    // TODO: Visual testing
    // await percySnapshot(page, 'Component - Testimonial')
  })

  test.skip('@wip buttons render consistently', async ({ page }) => {
    // Expected: All button styles should be consistent
    await page.goto("/")

    const buttons = page.locator('button, .button, [role="button"]')
    const count = await buttons.count()

    expect(count).toBeGreaterThan(0)

    // Check that buttons have consistent styling
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const styles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el)
          return {
            padding: computed.padding,
            borderRadius: computed.borderRadius,
          }
        })

        expect(styles.padding).toBeTruthy()
      }
    }
  })

  test.skip('@wip links have consistent styling', async ({ page }) => {
    // Expected: All links should have consistent appearance
    await page.goto("/about")

    const links = page.locator('main a')
    const count = await links.count()

    expect(count).toBeGreaterThan(0)

    // Sample a few links
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i)
      if (await link.isVisible()) {
        const color = await link.evaluate((el) => {
          return window.getComputedStyle(el).color
        })

        expect(color).toBeTruthy()
      }
    }
  })

  test.skip('@wip headings have consistent hierarchy', async ({ page }) => {
    // Expected: Heading styles should follow proper hierarchy
    await page.goto("/articles")

    const h1Size = await page.locator('h1').first().evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize)
    })

    const h2Size = await page.locator('h2').first().evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize)
    })

    // h1 should be larger than h2
    expect(h1Size).toBeGreaterThan(h2Size)
  })

  test.skip('@wip cards have consistent appearance', async ({ page }) => {
    // Expected: All card components should look similar
    await page.goto("/services")

    const cards = page.locator('[class*="card"], [data-card]')
    const count = await cards.count()

    if (count > 1) {
      const firstCardStyle = await cards.first().evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          borderRadius: computed.borderRadius,
          padding: computed.padding,
        }
      })

      const secondCardStyle = await cards.nth(1).evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          borderRadius: computed.borderRadius,
          padding: computed.padding,
        }
      })

      // Cards should have same border radius
      expect(firstCardStyle.borderRadius).toBe(secondCardStyle.borderRadius)
    }
  })

  test.skip('@wip icons render correctly', async ({ page }) => {
    // Expected: SVG icons should render without issues
    await page.goto("/")

    const icons = page.locator('svg')
    const count = await icons.count()

    expect(count).toBeGreaterThan(0)

    // Check that icons have proper dimensions
    for (let i = 0; i < Math.min(count, 5); i++) {
      const icon = icons.nth(i)
      if (await icon.isVisible()) {
        const box = await icon.boundingBox()
        if (box) {
          expect(box.width).toBeGreaterThan(0)
          expect(box.height).toBeGreaterThan(0)
        }
      }
    }
  })
})
