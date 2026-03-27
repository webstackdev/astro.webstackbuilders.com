import { test, expect } from '@playwright/test'

test('debug theme setting', async ({ page }) => {
  await page.addInitScript((themeId) => {
    document.documentElement.setAttribute('data-theme', themeId)
    try { window.localStorage.setItem('theme', themeId) } catch {}
  }, 'a11y')

  await page.goto('/')

  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  const stored = await page.evaluate(() => {
    try { return localStorage.getItem('theme') } catch { return 'ERROR' }
  })

  console.log(`data-theme: "${theme}"`)
  console.log(`localStorage theme: "${stored}"`)
  // Just log, don't assert
})
