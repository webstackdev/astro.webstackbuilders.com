import { init as sentryInit } from '@sentry/astro'
import { SENTRY_DSN } from 'astro:env/server'
import { getPackageRelease, isDev, isProd } from '@pages/api/_environment'

let initialized = false

export function ensureApiSentry(): void {
  if (initialized) {
    return
  }

  if (!isProd()) {
    return
  }

  if (!SENTRY_DSN) {
    console.warn('[sentry] SENTRY_DSN is not configured; server-side telemetry disabled')
    initialized = true
    return
  }

  sentryInit({
    dsn: SENTRY_DSN,
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

ensureApiSentry()
