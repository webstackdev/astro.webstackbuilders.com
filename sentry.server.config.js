import * as Sentry from "@sentry/astro"
import { PUBLIC_SENTRY_DSN } from "astro:env/client"

/**
 * Server-side Sentry initialization
 *
 * This runs on the server (SSR/SSG build time and API routes).
 * It tracks server-side errors, API errors, and build-time issues.
 *
 * Note: SENTRY_AUTH_TOKEN is only needed for uploading source maps during build.
 * The server SDK only needs PUBLIC_SENTRY_DSN to report errors.
 */

const isProd = import.meta.env.PROD
const isDev = import.meta.env.DEV

// Initialize Sentry in production if DSN is available
if (isProd && PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: PUBLIC_SENTRY_DSN,

    /** Release name to track regressions between releases */
    release: import.meta.env['npm_package_name'] + '@' + import.meta.env['npm_package_version'],

    /** Environment name for filtering in Sentry */
    environment: 'production',

    /**
     * Sample rate for performance monitoring
     * Set to 1.0 to capture 100% of transactions
     * Lower in production to reduce quota usage (e.g., 0.1 for 10%)
     */
    tracesSampleRate: 1.0,

    /** Send PII (personally identifiable information) like IP addresses */
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
      if (isDev) {
        return null
      }
      return event
    },
  })
}
// Note: In development, Sentry is automatically disabled by the beforeSend hook
