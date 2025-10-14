import {
  BrowserClient,
  breadcrumbsIntegration,
  dedupeIntegration,
  defaultStackParser,
  getCurrentScope,
  globalHandlersIntegration,
  makeFetchTransport,
  linkedErrorsIntegration,
} from "@sentry/browser";
import { PUBLIC_SENTRY_DSN } from "astro:env/client"

/**
 * The DSN is a public key that identifies your Sentry project and allows
 * the client-side SDK to send error events directly to Sentry without
 * requiring the SENTRY_AUTH_TOKEN. The DSN is safe to include in the
 * client bundle as it does not grant administrative access to a Sentry
 * project.
 */

const IS_CI = import.meta.env['CI'] === 'true'

if (IS_CI && !PUBLIC_SENTRY_DSN) {
  throw new Error('PUBLIC_SENTRY_DSN environment variable is required in CI but not set')
}

const client = new BrowserClient({
  dsn: PUBLIC_SENTRY_DSN,
  // integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  integrations: [
    breadcrumbsIntegration(),
    globalHandlersIntegration(),
    linkedErrorsIntegration(),
    dedupeIntegration(),
  ],
  /** Release name to track regressions between releases */
  release: import.meta.env['npm_package_name'] + '@' + import.meta.env['npm_package_version'],
  /**
   * Capture Replay for 10% of all sessions, plus 100% of sessions with an error
   */
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  /** Adds request headers and IP for users */
  sendDefaultPii: true,
  stackParser: defaultStackParser,
  /**
   * Set tracesSampleRate to 1.0 to capture 100% of transactions for
   * performance monitoring
   */
  tracesSampleRate: 1.0,
  transport: makeFetchTransport,
})

getCurrentScope().setClient(client)

client.init()
