import { init as sentryInit } from '@sentry/astro'
import { getPackageRelease, getSentryDsn, isProd } from '@pages/api/_utils/environment'
import { serverSentryDataCollection } from '@lib/sentry/dataCollection'

let initialized = false

export function ensureApiSentry(): void {
  if (!isProd() || initialized) {
    return
  }

  try {
    sentryInit({
      dsn: getSentryDsn(),
      release: getPackageRelease(),
      environment: 'production',
      tracesSampleRate: 1.0,
      dataCollection: serverSentryDataCollection,
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
  } catch (error) {
    console.error('[api] failed to initialize Sentry; continuing without telemetry', error)
  }
}

ensureApiSentry()
