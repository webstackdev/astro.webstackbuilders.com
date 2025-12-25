import { init as sentryInit } from '@sentry/astro'
import { getPackageRelease, getSentryDsn, isDev, isProd } from '@actions/utils/environment/environmentActions'

let initialized = false

export function ensureActionsSentry(): void {
  if (initialized) {
    return
  }

  if (!isProd()) {
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
      if (isDev()) {
        return null
      }
      return event
    },
  })

  initialized = true
}

ensureActionsSentry()
