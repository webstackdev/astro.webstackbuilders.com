import { init as sentryInit } from '@sentry/astro'
import {
  getPackageRelease,
  getSentryDsn,
  isProd,
} from '@actions/utils/environment/environmentActions'

let initialized = false

export function ensureActionSentry(): void {
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
      // any logic to modify the event before sending to Sentry
      return event
    },
  })

  initialized = true
}
