/**
 * Contact Page E2E Tests
 * Tests for the contact page and form
 */
import { BasePage, test } from '@test/e2e/helpers'

test.describe('Contact Page', () => {
  test('@ready page loads with correct title', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    await page.expectTitle(/Contact/)
  })

  test('@ready hero section displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    await page.expectTextContains('h1', /Let's Build Something Amazing/)
  })

  test('@ready contact form is visible', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    await page.expectContactForm()
  })

  test('@ready required form fields are present', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    // Required fields: name, email, message
    await page.expectContactFormNameInput()
    await page.expectContactFormEmailInput()
    await page.expectContactFormMessageInput()
  })

  test('@ready optional form fields are present', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    // Optional fields: company, phone, project type, budget, timeline
    await page.expectElementVisible('#company')
    await page.expectElementVisible('#phone')
    await page.expectElementVisible('#project_type')
    await page.expectElementVisible('#budget')
    await page.expectElementVisible('#timeline')
  })

  test('@ready GDPR consent checkbox present', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    // Contact form uses id="contact-gdpr-consent"
    await page.expectContactFormGdpr()
  })

  test('@ready contact information sidebar displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    // The sidebar has "Get In Touch" heading
    await page.expectTextVisible('Get In Touch')
  })

  test('@ready submit button is present', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    await page.expectSubmitButton('Send Project Details')
  })

  test('@ready form has proper labels and accessibility', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    // Check that required inputs have associated labels
    await page.expectLabelFor('name', /Full Name/)
    await page.expectLabelFor('email', /Email/)
    await page.expectLabelFor('message', /Project Description/)
  })

  test('@ready form sections are properly organized', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    // Check for section headings - use h3 selector to avoid matching text in paragraphs
    await page.expectHasHeading('Contact Information')
    await page.expectHasHeading('Project Details')
    await page.expectHasHeading('Project Files')
  })

  test('@ready data retention notice is displayed', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    // Check for GDPR-compliant data retention notice
    await page.expectTextVisible('Data Retention')
    await page.expectTextVisible('Your Rights')
  })

  test('@ready responsive: mobile view renders correctly', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/contact')
    await page.expectContactForm()
    await page.expectHeading()
  })

  test('@ready page has no console errors', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    await page.expectNoErrors()
  })
})
