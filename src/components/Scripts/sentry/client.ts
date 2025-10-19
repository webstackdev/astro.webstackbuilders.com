import {
  BrowserClient,
  breadcrumbsIntegration,
  browserTracingIntegration,
  dedupeIntegration,
  defaultStackParser,
  feedbackIntegration,
  getCurrentScope,
  globalHandlersIntegration,
  httpClientIntegration,
  makeFetchTransport,
  linkedErrorsIntegration,
  replayIntegration,
} from '@sentry/browser'
import { PUBLIC_SENTRY_DSN } from 'astro:env/client'

/**
 * Client-side Sentry initialization
 *
 * The DSN is a public key that identifies your Sentry project and allows
 * the client-side SDK to send error events directly to Sentry without
 * requiring the SENTRY_AUTH_TOKEN. The DSN is safe to include in the
 * client bundle as it does not grant administrative access to a Sentry
 * project.
 *
 * This must be loaded early (non-lazy) to catch initialization errors.
 */

const isProd = import.meta.env.PROD
const isDev = import.meta.env.DEV

// Only initialize Sentry in production with valid DSN
if (isProd && PUBLIC_SENTRY_DSN) {
  const client = new BrowserClient({
    dsn: PUBLIC_SENTRY_DSN,

    integrations: [
      // Core integrations
      breadcrumbsIntegration({
        console: true, // Log console messages as breadcrumbs
        dom: true, // Log DOM events as breadcrumbs
        fetch: true, // Log fetch requests as breadcrumbs
        history: true, // Log navigation as breadcrumbs
        xhr: true, // Log XHR requests as breadcrumbs
      }),
      globalHandlersIntegration({
        onerror: true, // Catch unhandled errors
        onunhandledrejection: true, // Catch unhandled promise rejections
      }),
      linkedErrorsIntegration(), // Link related errors together
      dedupeIntegration(), // Prevent duplicate error reports

      // HTTP monitoring
      httpClientIntegration({
        failedRequestStatusCodes: [[400, 599]], // Track failed HTTP requests
      }),

      // Performance monitoring
      browserTracingIntegration({
        // Track page loads and navigation timing
        enableInp: true, // Enable Interaction to Next Paint monitoring
        enableLongAnimationFrame: true, // Monitor long animation frames
      }),

      // Session Replay - visual reproduction of user sessions
      replayIntegration({
        maskAllText: false, // Mask sensitive text (set to true if needed)
        blockAllMedia: false, // Block media elements (set to true if needed)
        maskAllInputs: true, // Mask form inputs by default
      }),

      // User Feedback - allow users to report issues
      feedbackIntegration({
        colorScheme: 'system', // Match user's color scheme
        showBranding: false, // Hide Sentry branding
      }),
    ],

    /** Release name to track regressions between releases */
    release: import.meta.env['npm_package_name'] + '@' + import.meta.env['npm_package_version'],

    /** Environment name for filtering in Sentry */
    environment: 'production',

    /**
     * Session Replay sampling rates
     * - replaysSessionSampleRate: % of normal sessions to record (10%)
     * - replaysOnErrorSampleRate: % of sessions with errors to record (100%)
     */
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    /**
     * Performance monitoring sample rate
     * Set to 1.0 to capture 100% of transactions
     * Lower in production to reduce quota usage (e.g., 0.1 for 10%)
     */
    tracesSampleRate: 1.0,

    /** Send PII (personally identifiable information) like IP and user agent */
    sendDefaultPii: true,

    /** Stack trace parser */
    stackParser: defaultStackParser,

    /** Transport mechanism (uses fetch API) */
    transport: makeFetchTransport,

    /** Attach stack traces to all messages */
    attachStacktrace: true,

    /** Max breadcrumbs to keep (default is 100) */
    maxBreadcrumbs: 100,

    /**
     * Before sending events, you can modify or drop them
     * Useful for filtering sensitive data
     */
    beforeSend(event, _hint) {
      // Don't send errors in development
      if (isDev) {
        return null
      }

      // Filter out specific errors if needed
      // if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      //   return null
      // }

      return event
    },
  })

  getCurrentScope().setClient(client)
  client.init()
} else if (isDev) {
  // Development: Log that Sentry is disabled
  console.info('🔧 Sentry disabled in development mode')
}
