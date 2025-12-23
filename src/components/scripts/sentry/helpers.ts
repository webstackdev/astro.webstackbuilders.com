import { getCurrentScope, type BrowserOptions } from '@sentry/browser'
import { isProd } from '@components/scripts/utils/environmentClient'
import { getConsentSnapshot } from '@components/scripts/store/consent'

type BeforeSendHandler = NonNullable<BrowserOptions['beforeSend']>

/**
 * Applies consent-aware filtering to Sentry events before they are sent.
 */
export const beforeSendHandler: BeforeSendHandler = (event, _hint) => {
  if (!isProd()) {
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
 * Sets Sentry scope context when consent changes to keep
 * telemetry aligned with user preferences.
 */
export function updateConsentContext(hasAnalyticsConsent: boolean): void {
  const scope = getCurrentScope()

  scope.setContext('consent', {
    analytics: hasAnalyticsConsent,
    timestamp: new Date().toISOString(),
  })

  console.log(`🔒 Sentry PII ${hasAnalyticsConsent ? 'enabled' : 'disabled'} based on analytics consent`)
}
