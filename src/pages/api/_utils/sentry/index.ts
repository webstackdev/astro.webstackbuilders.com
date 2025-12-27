import { init as sentryInit } from '@sentry/astro'
import { getPackageRelease, getSentryDsn, isProd } from '@pages/api/_utils/environment'

let initialized = false

export function ensureApiSentry(): void {
  if (!isProd() || initialized) {
    return
  }

  sentryInit({
    dsn: getSentryDsn(),
    release: getPackageRelease(),
    environment: 'production',
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
    attachStacktrace: true,
    maxBreadcrumbs: 100,
    beforeSend(event) {
      if (!isProd()) {
        return null
      }
      return event
    },
  })

  initialized = true
}

ensureApiSentry()
