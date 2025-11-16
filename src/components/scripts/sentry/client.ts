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
import { SENTRY_DSN } from 'astro:env/client'
import { $consent } from '@components/scripts/store/consent'

/**
 * Client-side Sentry initialization with GDPR-compliant PII handling
 *
 * The DSN is a public key that identifies your Sentry project and allows
 * the client-side SDK to send error events directly to Sentry without
 * requiring the SENTRY_AUTH_TOKEN. The DSN is safe to include in the
 * client bundle as it does not grant administrative access to a Sentry
 * project.
 *
 * PII (personally identifiable information) is only sent when users have
 * granted analytics consent. This includes IP addresses, user agents, and
 * breadcrumbs that may contain user interactions.
 *
 * This must be loaded early (non-lazy) to catch initialization errors.
 */

export class SentryBootstrap {
  static init(): void {
    // Check analytics consent for PII handling
    const consentState = $consent.get()
    const hasAnalyticsConsent = consentState.analytics

    const client = new BrowserClient({
      dsn: SENTRY_DSN,

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

      /**
       * Send PII (personally identifiable information) conditionally
       * Only send IP and user agent if user has granted analytics consent
       */
      sendDefaultPii: hasAnalyticsConsent,

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
       * Useful for filtering sensitive data based on consent
       */
      beforeSend(event, _hint) {
        // Don't send errors in development
        if (import.meta.env.DEV) {
          return null
        }

        // If no analytics consent, scrub PII from event
        const currentConsent = $consent.get()
        if (!currentConsent.analytics) {
          // Remove IP address
          if (event.user) {
            delete event.user.ip_address
          }

          // Remove user agent and other request data
          if (event.request) {
            delete event.request.headers
          }

          // Clear breadcrumbs that may contain user interactions
          if (event.breadcrumbs) {
            event.breadcrumbs = []
          }
        }

        return event
      },
    })

    getCurrentScope().setClient(client)
    client.init()

    console.log('✅ Sentry monitoring initialized')
  }

  /**
   * Update Sentry context when consent changes
   * Called by consent store subscriber
   */
  static updateConsentContext(hasAnalyticsConsent: boolean): void {
    const scope = getCurrentScope()

    // Set consent status in Sentry context
    scope.setContext('consent', {
      analytics: hasAnalyticsConsent,
      timestamp: new Date().toISOString(),
    })

    // Log consent change
    console.log(`🔒 Sentry PII ${hasAnalyticsConsent ? 'enabled' : 'disabled'} based on analytics consent`)
  }
}
