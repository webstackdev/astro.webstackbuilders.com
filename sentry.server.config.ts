import {init as sentryInit } from '@sentry/astro'
import { SENTRY_DSN } from 'astro:env/client'
import { getPackageRelease, isDev, isProd } from './src/lib/config'

/**
 * Server-side Sentry initialization
 *
 * This runs on the server (SSR/SSG build time and API routes).
 * It tracks server-side errors, API errors, and build-time issues.
 *
 * Note: SENTRY_AUTH_TOKEN is only needed for uploading source maps during build.
 * The server SDK only needs SENTRY_DSN to report errors.
 */

// Initialize Sentry in production if DSN is available
if (isProd()) {
  sentryInit({
    dsn: SENTRY_DSN,

    /** Release name to track regressions between releases */
    release: getPackageRelease(),

    /** Environment name for filtering in Sentry */
    environment: 'production',

    /**
     * Sample rate for performance monitoring
     * Set to 1.0 to capture 100% of transactions
     * Lower in production to reduce quota usage (e.g., 0.1 for 10%)
     */
    tracesSampleRate: 1.0,

    /**
     * Send PII (personally identifiable information) like IP addresses
     * Server-side errors always include PII for debugging as they occur in
     * API routes and SSR contexts where user consent is not directly available.
     * Client-side Sentry respects user consent preferences.
     */
    sendDefaultPii: true,

    /** Attach stack traces to all messages */
    attachStacktrace: true,

    /** Max breadcrumbs to keep */
    maxBreadcrumbs: 100,

    /**
     * Before sending events, you can modify or drop them
     */
    beforeSend(event, _hint) {
      // Don't send in development
      if (isDev()) {
        return null
      }
      return event
    },
  })
}
// Note: In development, Sentry is automatically disabled by the beforeSend hook
