/**
 * Code component tests
 * Covers the dedicated testing fixture for standalone code blocks and tabbed code examples.
 */

import { BasePage, expect, test } from '@test/e2e/helpers'

const fixturePath = '/testing/code'
const codeBlockSelector = '[data-testid="code-block-fixture"]'
const multiTabsSelector = '[data-testid="code-tabs-multi-fixture"]'
const singleTabsSelector = '[data-testid="code-tabs-single-fixture"]'
const excludedTabsSelector = '[data-testid="code-tabs-excluded-fixture"]'

const loadCodeFixture = async (playwrightPage: Parameters<typeof BasePage.init>[0]) => {
  const page = await BasePage.init(playwrightPage)
  await page.goto(fixturePath)
  await expect(page.locator(codeBlockSelector)).toBeVisible()
  return page
}

test.describe('Code Components', () => {
  test('@ready enhances a standalone code-block without changing its content', async ({ page: playwrightPage }) => {
    const page = await loadCodeFixture(playwrightPage)

    await expect(playwrightPage.getByRole('heading', { name: 'Code Components Test Fixture' })).toBeVisible()
    await expect(page.locator(codeBlockSelector)).toHaveAttribute('data-enhanced', 'true')
    await expect(page.locator(`${codeBlockSelector} pre`)).toHaveAttribute('data-language', 'typescript')
    await expect(page.locator(`${codeBlockSelector} code`)).toHaveText("const message = 'hello'")
  })

  test('@ready switches between tabbed code blocks in the multi-tab fixture', async ({ page: playwrightPage }) => {
    const page = await loadCodeFixture(playwrightPage)
    const multiTabs = page.locator(multiTabsSelector)
    const javascriptButton = multiTabs.getByRole('button', { name: 'JavaScript' })
    const typeScriptButton = multiTabs.getByRole('button', { name: 'TypeScript' })
    const javascriptPre = multiTabs.locator('pre').nth(0)
    const typeScriptPre = multiTabs.locator('pre').nth(1)

    await expect(javascriptButton).toBeVisible()
    await expect(typeScriptButton).toBeVisible()
    await expect(javascriptPre).toBeVisible()
    await expect(typeScriptPre).toHaveClass(/hidden/)

    await typeScriptButton.click()

    await expect(javascriptPre).toHaveClass(/hidden/)
    await expect(typeScriptPre).toBeVisible()
    await expect(typeScriptButton).toHaveClass(/text-content/)
    await expect(javascriptButton).toHaveClass(/text-content-offset/)
  })

  test('@ready renders the single-tab and excluded-language fallbacks correctly', async ({ page: playwrightPage }) => {
    const page = await loadCodeFixture(playwrightPage)
    const singleTabs = page.locator(singleTabsSelector)
    const excludedTabs = page.locator(excludedTabsSelector)

    await expect(singleTabs.locator('button[data-code-tabs-button]')).toHaveCount(0)
    await expect(singleTabs.getByText('TypeScript')).toBeVisible()
    await expect(singleTabs.getByRole('button', { name: 'Copy "TypeScript"', exact: true })).toBeAttached()
    await expect(singleTabs.getByRole('button', { name: 'Copy', exact: true })).toBeVisible()

    await expect(excludedTabs.locator('button[data-code-tabs-button]')).toHaveCount(0)
    await expect(excludedTabs.getByText('plain text')).toBeVisible()
    await expect(excludedTabs.getByRole('button', { name: 'Copy', exact: true })).toBeVisible()
  })

  test('@ready copies the active code and single-tab label using the clipboard integration', async ({
    page: playwrightPage,
  }) => {
    const page = await loadCodeFixture(playwrightPage)

    await playwrightPage.evaluate(() => {
      const windowWithClipboardState = window as Window & { __copiedValues?: string[] }
      windowWithClipboardState.__copiedValues = []

      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            windowWithClipboardState.__copiedValues?.push(text)
          },
        },
      })
    })

    const multiTabs = page.locator(multiTabsSelector)
    await multiTabs.getByRole('button', { name: 'TypeScript' }).click()
    await multiTabs.getByRole('button', { name: 'Copy' }).click()

    const singleTabs = page.locator(singleTabsSelector)
    await singleTabs.getByRole('button', { name: 'Copy "TypeScript"', exact: true }).click()

    await expect.poll(async () => {
      return await playwrightPage.evaluate(() => {
        const windowWithClipboardState = window as Window & { __copiedValues?: string[] }
        return windowWithClipboardState.__copiedValues ?? []
      })
    }).toEqual(["console.log('B')", 'TypeScript'])
  })
})