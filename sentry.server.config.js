import * as Sentry from "@sentry/astro"
import { PUBLIC_SENTRY_DSN } from "astro:env/client"
import { SENTRY_AUTH_TOKEN } from "astro:env/server"

const IS_CI = import.meta.env['CI'] === 'true'
if (IS_CI && !PUBLIC_SENTRY_DSN) {
  throw new Error('PUBLIC_SENTRY_DSN environment variable is required in CI but not set')
}

if (IS_CI && SENTRY_AUTH_TOKEN) {
  Sentry.init({
    dsn: PUBLIC_SENTRY_DSN,
    /** Release name to track regressions between releases */
    release: import.meta.env['npm_package_name'] + '@' + import.meta.env['npm_package_version'],
    /** Adds request headers and IP for users */
    sendDefaultPii: true,
  })
}
