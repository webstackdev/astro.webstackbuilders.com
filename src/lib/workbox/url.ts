/**
 * Builds the offline route URL including the encoded original request URL
 */
export const buildOfflineRedirectUrl = (requestUrl: string): string => {
  const originalUrl = encodeURIComponent(requestUrl)

  return `/offline?returnTo=${originalUrl}`
}