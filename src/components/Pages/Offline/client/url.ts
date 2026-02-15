/**
 * Returns a same-origin retry destination extracted from the current offline page query string.
 */
export const getSafeReturnToUrl = (search: string, origin: string): string | null => {
  const params = new URLSearchParams(search)
  const returnTo = params.get('returnTo')

  if (!returnTo) {
    return null
  }

  try {
    const targetUrl = new URL(returnTo, origin)

    if (targetUrl.origin !== origin || targetUrl.pathname === '/offline') {
      return null
    }

    return targetUrl.toString()
  } catch {
    return null
  }
}
