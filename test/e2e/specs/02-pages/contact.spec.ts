/**
 * Contact Page E2E Tests
 * Tests for the contact page and form
 */
import { test, expect, setupConsoleErrorChecker } from '@test/e2e/helpers'

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact')
  })

  test('@ready page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Contact/)
  })

  test('@ready hero section displays', async ({ page }) => {
    const heroHeading = page.locator('h1')
    await expect(heroHeading).toContainText(/Let's Build Something Amazing/)
  })

  test('@ready contact form is visible', async ({ page }) => {
    const form = page.locator('#contactForm')
    await expect(form).toBeVisible()
  })

  test('@ready required form fields are present', async ({ page }) => {
    // Required fields: name, email, message
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#message')).toBeVisible()
  })

  test('@ready optional form fields are present', async ({ page }) => {
    // Optional fields: company, phone, project type, budget, timeline
    await expect(page.locator('#company')).toBeVisible()
    await expect(page.locator('#phone')).toBeVisible()
    await expect(page.locator('#project_type')).toBeVisible()
    await expect(page.locator('#budget')).toBeVisible()
    await expect(page.locator('#timeline')).toBeVisible()
  })

  test('@ready GDPR consent checkbox present', async ({ page }) => {
    // Contact form uses id="contact-gdpr-consent"
    const gdprConsent = page.locator('#contact-gdpr-consent')
    await expect(gdprConsent).toBeVisible()
  })

  test('@ready contact information sidebar displays', async ({ page }) => {
    // The sidebar has "Get In Touch" heading
    const sidebar = page.locator('text=Get In Touch')
    await expect(sidebar).toBeVisible()
  })

  test('@ready submit button is present', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toContainText(/Send Project Details/)
  })

  test('@ready form has proper labels and accessibility', async ({ page }) => {
    // Check that required inputs have associated labels
    const nameLabel = page.locator('label[for="name"]')
    await expect(nameLabel).toBeVisible()
    await expect(nameLabel).toContainText(/Full Name/)

    const emailLabel = page.locator('label[for="email"]')
    await expect(emailLabel).toBeVisible()
    await expect(emailLabel).toContainText(/Email/)

    const messageLabel = page.locator('label[for="message"]')
    await expect(messageLabel).toBeVisible()
    await expect(messageLabel).toContainText(/Project Description/)
  })

  test('@ready form sections are properly organized', async ({ page }) => {
    // Check for section headings - use h3 selector to avoid matching text in paragraphs
    await expect(page.locator('h3').filter({ hasText: 'Contact Information' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: 'Project Details' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: 'Project Files' })).toBeVisible()
  })

  test('@ready data retention notice is displayed', async ({ page }) => {
    // Check for GDPR-compliant data retention notice
    await expect(page.locator('text=Data Retention')).toBeVisible()
    await expect(page.locator('text=Your Rights')).toBeVisible()
  })

  test('@ready responsive: mobile view renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('#contactForm')).toBeVisible()
    await expect(page.locator('h1')).toBeVisible()
  })

  test('@ready page has no console errors', async ({ page }) => {
    const errorChecker = setupConsoleErrorChecker(page)
    await page.goto('/contact')
    await page.waitForLoadState('networkidle')
    expect(errorChecker.getFiltered404s().length).toBe(0)
  })
})
