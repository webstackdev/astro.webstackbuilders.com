import { getCurrentScope, type BrowserOptions } from '@sentry/browser'
import { isProd } from '@components/scripts/utils/environmentClient'
import { getConsentSnapshot } from '@components/scripts/store/consent'

type BeforeSendHandler = NonNullable<BrowserOptions['beforeSend']>

const SAFE_BREADCRUMB_CATEGORIES = new Set(['script', 'sentry.event'])

const isConsentActionRequest = (requestUrl: string): boolean => {
  return (
    requestUrl.includes('/_actions/gdpr.consentCreate') ||
    requestUrl.includes('/_actions/gdpr/consentCreate')
  )
}

const isHandledContactSubmitHttpError = (event: Parameters<BeforeSendHandler>[0]): boolean => {
  const requestUrl = event.request?.url
  const exception = event.exception?.values?.[0]
  const mechanismType = exception?.mechanism?.type
  const errorMessage = exception?.value ?? event.message ?? ''

  return (
    typeof requestUrl === 'string' &&
    requestUrl.includes('/_actions/contact.submit') &&
    mechanismType === 'auto.http.client.fetch' &&
    typeof errorMessage === 'string' &&
    errorMessage.includes('HTTP Client Error with status code:')
  )
}

const isHandledConsentHttpError = (event: Parameters<BeforeSendHandler>[0]): boolean => {
  const requestUrl = event.request?.url
  const exception = event.exception?.values?.[0]
  const mechanismType = exception?.mechanism?.type
  const errorMessage = exception?.value ?? event.message ?? ''
  const statusCodeMatch =
    typeof errorMessage === 'string' ? errorMessage.match(/status code:\s*(\d{3})/i) : null
  const statusCode = statusCodeMatch?.[1] ? Number(statusCodeMatch[1]) : undefined

  return (
    typeof requestUrl === 'string' &&
    isConsentActionRequest(requestUrl) &&
    mechanismType === 'auto.http.client.fetch' &&
    (statusCode === 403 || statusCode === 429)
  )
}

const isHandledDownloadsSubmitHttpError = (event: Parameters<BeforeSendHandler>[0]): boolean => {
  const requestUrl = event.request?.url
  const exception = event.exception?.values?.[0]
  const mechanismType = exception?.mechanism?.type
  const errorMessage = exception?.value ?? event.message ?? ''

  return (
    typeof requestUrl === 'string' &&
    requestUrl.includes('/_actions/downloads.submit') &&
    mechanismType === 'auto.http.client.fetch' &&
    typeof errorMessage === 'string' &&
    errorMessage.includes('HTTP Client Error with status code:')
  )
}

const isHandledNewsletterSubscribeHttpError = (
  event: Parameters<BeforeSendHandler>[0]
): boolean => {
  const requestUrl = event.request?.url
  const exception = event.exception?.values?.[0]
  const mechanismType = exception?.mechanism?.type
  const errorMessage = exception?.value ?? event.message ?? ''

  return (
    typeof requestUrl === 'string' &&
    requestUrl.includes('/_actions/newsletter.subscribe') &&
    mechanismType === 'auto.http.client.fetch' &&
    typeof errorMessage === 'string' &&
    errorMessage.includes('HTTP Client Error with status code:')
  )
}

const isNewsletterConfirmActionRequest = (requestUrl: string): boolean => {
  return (
    requestUrl.includes('/_actions/newsletter.confirm') ||
    requestUrl.includes('/_actions/newsletter/confirm')
  )
}

const isHandledNewsletterConfirmHttpError = (event: Parameters<BeforeSendHandler>[0]): boolean => {
  const requestUrl = event.request?.url
  const exception = event.exception?.values?.[0]
  const mechanismType = exception?.mechanism?.type
  const errorMessage = exception?.value ?? event.message ?? ''

  return (
    typeof requestUrl === 'string' &&
    isNewsletterConfirmActionRequest(requestUrl) &&
    mechanismType === 'auto.http.client.fetch' &&
    typeof errorMessage === 'string' &&
    errorMessage.includes('HTTP Client Error with status code:')
  )
}

const isSearchActionRequest = (requestUrl: string): boolean => {
  return (
    requestUrl.includes('/_actions/search.query') || requestUrl.includes('/_actions/search/query')
  )
}

const isHandledSearchHttpError = (event: Parameters<BeforeSendHandler>[0]): boolean => {
  const requestUrl = event.request?.url
  const exception = event.exception?.values?.[0]
  const mechanismType = exception?.mechanism?.type
  const errorMessage = exception?.value ?? event.message ?? ''

  return (
    typeof requestUrl === 'string' &&
    isSearchActionRequest(requestUrl) &&
    mechanismType === 'auto.http.client.fetch' &&
    typeof errorMessage === 'string' &&
    errorMessage.includes('HTTP Client Error with status code:')
  )
}

const isMyDataActionRequest = (requestUrl: string): boolean => {
  return (
    requestUrl.includes('/_actions/gdpr.verifyDsar') ||
    requestUrl.includes('/_actions/gdpr/verifyDsar') ||
    requestUrl.includes('/_actions/gdpr.requestData') ||
    requestUrl.includes('/_actions/gdpr/requestData')
  )
}

const isHandledMyDataHttpError = (event: Parameters<BeforeSendHandler>[0]): boolean => {
  const requestUrl = event.request?.url
  const exception = event.exception?.values?.[0]
  const mechanismType = exception?.mechanism?.type
  const errorMessage = exception?.value ?? event.message ?? ''

  return (
    typeof requestUrl === 'string' &&
    isMyDataActionRequest(requestUrl) &&
    mechanismType === 'auto.http.client.fetch' &&
    typeof errorMessage === 'string' &&
    errorMessage.includes('HTTP Client Error with status code:')
  )
}

const isWebmentionsActionRequest = (requestUrl: string): boolean => {
  return (
    requestUrl.includes('/_actions/webmentions.list') ||
    requestUrl.includes('/_actions/webmentions/list')
  )
}

const isHandledWebmentionsHttpError = (event: Parameters<BeforeSendHandler>[0]): boolean => {
  const requestUrl = event.request?.url
  const exception = event.exception?.values?.[0]
  const mechanismType = exception?.mechanism?.type
  const errorMessage = exception?.value ?? event.message ?? ''
  const statusCodeMatch =
    typeof errorMessage === 'string' ? errorMessage.match(/status code:\s*(\d{3})/i) : null
  const statusCode = statusCodeMatch?.[1] ? Number(statusCodeMatch[1]) : undefined

  return (
    typeof requestUrl === 'string' &&
    isWebmentionsActionRequest(requestUrl) &&
    mechanismType === 'auto.http.client.fetch' &&
    statusCode === 403
  )
}

const isHandledConsentLogRetryError = (event: Parameters<BeforeSendHandler>[0]): boolean => {
  const errorMessage = event.exception?.values?.[0]?.value ?? event.message ?? ''
  const tags = event.tags ?? {}

  return (
    tags['scriptName'] === 'cookieConsent' &&
    tags['operation'] === 'logConsentToAPI' &&
    typeof errorMessage === 'string' &&
    /try again in\s+\d+s/i.test(errorMessage)
  )
}

const isHandledConsentCheckpointClientError = (
  event: Parameters<BeforeSendHandler>[0]
): boolean => {
  const errorMessage = event.exception?.values?.[0]?.value ?? event.message ?? ''
  const tags = event.tags ?? {}

  return (
    tags['scriptName'] === 'cookieConsent' &&
    tags['operation'] === 'logConsentToAPI' &&
    typeof errorMessage === 'string' &&
    (errorMessage.toLowerCase().includes('vercel security checkpoint') ||
      (errorMessage.toLowerCase().includes('<!doctype html') &&
        errorMessage.toLowerCase().includes('security checkpoint')))
  )
}

function scrubBreadcrumbs(
  breadcrumbs: NonNullable<Parameters<BeforeSendHandler>[0]['breadcrumbs']>
) {
  return breadcrumbs
    .filter(
      breadcrumb => breadcrumb.category && SAFE_BREADCRUMB_CATEGORIES.has(breadcrumb.category)
    )
    .map(breadcrumb => {
      const { data: _data, ...safeBreadcrumb } = breadcrumb

      return {
        ...safeBreadcrumb,
      }
    })
}

/**
 * Applies consent-aware filtering to Sentry events before they are sent.
 */
export const beforeSendHandler: BeforeSendHandler = (event, _hint) => {
  if (!isProd()) {
    return null
  }

  // The Contact form already handles action failures in the UI. Drop the
  // browser-side auto-fetch event and rely on the server-side action error.
  if (isHandledContactSubmitHttpError(event)) {
    return null
  }

  // Consent logging is best-effort on the client. Rate limiting and Vercel
  // security checkpoints can block the action without any user-visible impact,
  // so drop the browser-side auto-fetch event.
  if (isHandledConsentHttpError(event)) {
    return null
  }

  // The downloads form handles action failures in the UI. Drop the browser-side
  // auto-fetch event and rely on the user-facing error state instead.
  if (isHandledDownloadsSubmitHttpError(event)) {
    return null
  }

  // The newsletter form handles action failures in the UI. Drop the browser-side
  // auto-fetch event and rely on the server-side action error for diagnosis.
  if (isHandledNewsletterSubscribeHttpError(event)) {
    return null
  }

  // Newsletter confirmation handles action failures in the UI, so the
  // browser-side auto-fetch event is duplicate noise.
  if (isHandledNewsletterConfirmHttpError(event)) {
    return null
  }

  // Search handles action failures in the UI. Drop the browser-side auto-fetch
  // event and rely on the client-side fallback behavior instead.
  if (isHandledSearchHttpError(event)) {
    return null
  }

  // My Data verification and request flows render their own failure states, so
  // drop the duplicate browser-side auto-fetch event.
  if (isHandledMyDataHttpError(event)) {
    return null
  }

  // Webmentions are non-critical content enhancement. If the action is blocked
  // with a 403, the component degrades to an empty state and the auto-fetch
  // browser event becomes noise.
  if (isHandledWebmentionsHttpError(event)) {
    return null
  }

  // Consent logging retries are best-effort and user-invisible. If a handled
  // client exception still gets emitted from this path, drop it as noise.
  if (isHandledConsentLogRetryError(event)) {
    return null
  }

  // If a consent checkpoint response is wrapped into a handled client error,
  // drop that duplicate event as the action itself is already filtered.
  if (isHandledConsentCheckpointClientError(event)) {
    return null
  }

  const currentConsent = getConsentSnapshot()
  if (!currentConsent.analytics) {
    if (event.user) {
      delete event.user.ip_address
    }

    if (event.request) {
      delete event.request.headers
    }

    if (event.breadcrumbs) {
      event.breadcrumbs = scrubBreadcrumbs(event.breadcrumbs)
    }
  }

  return event
}

/**
 * Sets Sentry scope context when consent changes to keep
 * telemetry aligned with user preferences.
 */
export function updateConsentContext(hasAnalyticsConsent: boolean): void {
  const scope = getCurrentScope()

  scope.setContext('consent', {
    analytics: hasAnalyticsConsent,
    timestamp: new Date().toISOString(),
  })

  console.log(
    `🔒 Sentry PII ${hasAnalyticsConsent ? 'enabled' : 'disabled'} based on analytics consent`
  )
}
