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

const isHandledConsentRateLimitHttpError = (event: Parameters<BeforeSendHandler>[0]): boolean => {
  const requestUrl = event.request?.url
  const exception = event.exception?.values?.[0]
  const mechanismType = exception?.mechanism?.type
  const errorMessage = exception?.value ?? event.message ?? ''

  return (
    typeof requestUrl === 'string' &&
    isConsentActionRequest(requestUrl) &&
    mechanismType === 'auto.http.client.fetch' &&
    typeof errorMessage === 'string' &&
    errorMessage.includes('HTTP Client Error with status code: 429')
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

  // Consent logging is best-effort on the client. Rate limiting here is expected
  // under bursty preference changes, so drop the browser-side auto-fetch event.
  if (isHandledConsentRateLimitHttpError(event)) {
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

  // Consent logging retries are best-effort and user-invisible. If a handled
  // client exception still gets emitted from this path, drop it as noise.
  if (isHandledConsentLogRetryError(event)) {
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
