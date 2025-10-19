import {
  BrowserClient,
  breadcrumbsIntegration,
  dedupeIntegration,
  defaultStackParser,
  feedbackIntegration,
  getCurrentScope,
  globalHandlersIntegration,
  httpClientIntegration,
  makeFetchTransport,
  linkedErrorsIntegration,
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

export class SentryBootstrap {
  static init(): void {
    // Skip initialization if DSN is not configured
    if (!PUBLIC_SENTRY_DSN) {
      console.warn('⚠️ Sentry DSN not configured, skipping initialization')
      return
    }

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

        // User Feedback - allow users to report issues
        // @TODO: Implement a component for this
        feedbackIntegration({
          colorScheme: 'system', // Match user's color scheme
          showBranding: false, // Hide Sentry branding
        }),
      ],

      /** Release name to track regressions between releases */
      release: import.meta.env['npm_package_name'] + '@' + import.meta.env['npm_package_version'],

      /** Environment name for filtering in Sentry */
      environment: 'production',

      /** Stack trace parser */
      stackParser: defaultStackParser,

      /** Transport mechanism (uses fetch API) */
      transport: makeFetchTransport,

      /** Attach stack traces to all messages */
      attachStacktrace: true,

      /** Send PII (personally identifiable information) like IP and user agent */
      sendDefaultPii: true,

      /**
       * Max breadcrumbs to keep (default is 100). Breadcrumbs are a trail of events
       * that occurred just before an error or exception, similar to logs but with
       * more structured data. They provide critical context for debugging by
       * automatically capturing user interactions like clicks, key presses, and
       * network requests, as well as manually recorded events like user authentication
       * or state changes. This allows developers to see the sequence of actions
       * leading to a bug without having to reproduce it manually.
       */
      maxBreadcrumbs: 100,

      /**
       * Before sending events, you can modify or drop them
       * Useful for filtering sensitive data
       */
      beforeSend(event, _hint) {
        // Don't send errors in development
        if (import.meta.env.DEV) {
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

    console.log('✅ Sentry monitoring initialized')
  }
}
