/**
 * Diagram component tests
 * Covers the dedicated testing fixture for the Diagram caption and magnified image experience.
 */

import { BasePage, expect, test } from '@test/e2e/helpers'

const fixturePath = '/testing/diagram'
const figureSelector = 'figure'
const detailsSelector = `${figureSelector} details`
const summarySelector = `${detailsSelector} summary`
const descriptionSelector = `${detailsSelector} p`
const slotNoteSelector = '[data-diagram-fixture-note]'
const contentImageSelector = '[data-testid="content-image"]'
const imageTriggerSelector = `${contentImageSelector} [data-image-open]`
const imageDialogSelector = '[data-image-dialog]'
const modalImageSelector = '[data-image-modal-asset]'

const loadDiagramFixture = async (playwrightPage: Parameters<typeof BasePage.init>[0]) => {
  const page = await BasePage.init(playwrightPage)
  await page.goto(fixturePath, { skipCookieDismiss: true })
  await expect(page.locator(figureSelector)).toBeVisible()
  return page
}

test.describe('Diagram Component', () => {
  test('@ready renders the fixture diagram with caption, image preview, and slot content', async ({
    page: playwrightPage,
  }) => {
    const page = await loadDiagramFixture(playwrightPage)

    await expect(playwrightPage.getByRole('heading', { name: 'Diagram Component Test Fixture' })).toBeVisible()
    await expect(page.locator(contentImageSelector)).toBeVisible()
    await expect(page.locator(`${figureSelector} img`)).toHaveAttribute(
      'alt',
      'Service dependency flow for incident response escalation'
    )
    await expect(page.locator(imageTriggerSelector)).toHaveAttribute('data-image-open-position', 'top-left')
    await expect(page.locator(slotNoteSelector)).toHaveText(
      'Supporting note rendered through the Diagram default slot.'
    )
    await expect(page.locator(summarySelector)).toContainText(
      'Service dependency flow for incident response escalation'
    )
  })

  test('@ready expands and collapses the long description disclosure', async ({ page: playwrightPage }) => {
    const page = await loadDiagramFixture(playwrightPage)

    await expect(page.locator(detailsSelector)).not.toHaveAttribute('open', '')
    await expect(page.locator(descriptionSelector)).not.toBeVisible()

    await page.locator(summarySelector).click()

    await expect(page.locator(detailsSelector)).toHaveAttribute('open', '')
    await expect(page.locator(descriptionSelector)).toBeVisible()
    await expect(page.locator(descriptionSelector)).toHaveText(
      'A service map showing requests entering the public edge, moving through an API layer, then branching into application services, background workers, and supporting data stores used during incident response.'
    )

    await page.locator(summarySelector).click()
    await expect(page.locator(detailsSelector)).not.toHaveAttribute('open', '')
  })

  test('@ready opens the expanded image dialog and closes it with Escape', async ({ page: playwrightPage }) => {
    const page = await loadDiagramFixture(playwrightPage)

    await page.locator(imageTriggerSelector).click()

    await expect(page.locator(imageDialogSelector)).toBeVisible()
    await expect(playwrightPage.getByRole('dialog', {
      name: 'Expanded view for Service dependency flow for incident response escalation',
    })).toBeVisible()
    await expect(page.locator(modalImageSelector)).toHaveAttribute(
      'alt',
      'Service dependency flow for incident response escalation'
    )

    await playwrightPage.keyboard.press('Escape')
    await expect(page.locator(imageDialogSelector)).not.toBeVisible()
  })
})