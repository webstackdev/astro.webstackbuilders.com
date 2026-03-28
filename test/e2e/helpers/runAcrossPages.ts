import { BasePage, test } from '@test/e2e/helpers'

export const pages = [
  '/',
  '/about',
  '/articles',
  '/articles/demo',
  '/case-studies',
  '/consent',
  '/contact',
  '/privacy/my-data',
  '/newsletter',
  '/newsletter/confirm/error-token',
  '/newsletter/confirm/expired-token',
  '/newsletter/confirm/success',
  '/offline',
  '/privacy',
  '/search',
  '/services',
  '/terms',
  '/404',
]

export const pagesWithForms = [
  '/',
  '/articles/demo',
  '/consent',
  '/contact',
  '/privacy/my-data',
  '/newsletter',
  '/search',
]

interface PageLoopDiagnostics {
  currentUrl: string
  pathname: string
  readyState: string
  title: string
}

const getPageLoopDiagnostics = async (page: BasePage): Promise<PageLoopDiagnostics> => {
  if (page.page.isClosed()) {
    return {
      currentUrl: 'page-closed',
      pathname: 'unavailable',
      readyState: 'unavailable',
      title: 'unavailable',
    }
  }

  const currentUrl = page.page.url()

  const metadata = await page.evaluate(() => {
    return {
      pathname: window.location.pathname,
      readyState: document.readyState,
      title: document.title || '',
    }
  }).catch(() => {
    return {
      pathname: 'unavailable',
      readyState: 'unavailable',
      title: 'unavailable',
    }
  })

  return {
    currentUrl,
    pathname: metadata.pathname,
    readyState: metadata.readyState,
    title: metadata.title,
  }
}

const wrapPageLoopError = async (
  page: BasePage,
  url: string,
  error: unknown,
  formPagesOnly = false
) => {
  const diagnostics = await getPageLoopDiagnostics(page)
  const message = error instanceof Error ? error.message : String(error)

  throw new Error(
    [
      `Looped accessibility check failed on ${url}.`,
      `pageSet=${formPagesOnly ? 'pagesWithForms' : 'pages'}`,
      `currentUrl=${diagnostics.currentUrl}`,
      `pathname=${diagnostics.pathname}`,
      `title="${diagnostics.title}"`,
      `readyState=${diagnostics.readyState}`,
      `originalError=${message}`,
    ].join(' '),
    { cause: error instanceof Error ? error : undefined }
  )
}

export const runAcrossPages = async (
  page: BasePage,
  label: string,
  callback: (_url: string) => Promise<void>,
  formPagesOnly = false
) => {
  const loopPages = formPagesOnly ? pagesWithForms : pages

  for (const url of loopPages) {
    await test.step(`${label} on ${url}`, async () => {
      try {
        await callback(url)
      } catch (error) {
        await wrapPageLoopError(page, url, error, formPagesOnly)
      }
    })
  }
}
