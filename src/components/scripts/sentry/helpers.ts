import { getCurrentScope } from '@sentry/browser'
import type { Event as SentryEvent } from '@sentry/types'
import { isDev } from '@components/scripts/utils/environmentClient'
import { getConsentSnapshot } from '@components/scripts/store/consent'

/**
 * Applies consent-aware filtering to Sentry events before they are sent.
 */
export function beforeSendHandler(event: SentryEvent): SentryEvent | null {
  if (isDev()) {
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
      event.breadcrumbs = []
    }
  }

  return event
}

/**
 * Sets Sentry scope context when consent changes to keep telemetry aligned with user preferences.
 */
export function updateConsentContext(hasAnalyticsConsent: boolean): void {
  const scope = getCurrentScope()

  scope.setContext('consent', {
    analytics: hasAnalyticsConsent,
    timestamp: new Date().toISOString(),
  })

  console.log(`🔒 Sentry PII ${hasAnalyticsConsent ? 'enabled' : 'disabled'} based on analytics consent`)
}
