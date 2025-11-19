import { envField } from 'astro/config'
import type { AstroUserConfig } from 'astro'

/**
 * Env var usage:
 *
 * import { SERVER_API_URL} from "astro:env/server";
 * <script>import { API_URL } from "astro:env/client";</script>
 *
 * Variables are accessed through import { MY_VAR } from 'astro:env/client'
 * or import { MY_VAR } from 'astro:env/server', ensuring only the intended
 * variables are available in each context.
 *
 * Public server variables: These variables end up in the final server bundle and can be accessed on the server through the astro:env/server module
 *
 * Secret server variables: These variables are not part of the final bundle and can be accessed on the server through the astro:env/server module.
 *
 * Public client variables: These variables end up in both the final client and server bundles, and can be accessed from both client and server through the astro:env/client module
 *
 * Secret client variables: not supported because there is no safe way to send this data to the client.
 *
 * ✅ CORRECT: Public client variables are available from BOTH modules
 * import { CLIENT_PUBLIC_DSN } from 'astro:env/client'  // Works in client code
 * import { CLIENT_PUBLIC_KEY } from 'astro:env/server' // Works in server code (API routes)
 *
 * ❌ WRONG: Server variables are ONLY available from astro:env/server
 * import { CLIENT_PUBLIC_KEY } from 'astro:env/client' // TypeScript error!
 */

export const environmentalVariablesConfig: AstroUserConfig['env'] = {
  schema: {
    PACKAGE_RELEASE_VERSION: envField.string({
      access: 'public',
      context: 'client',
      default: 'unknown@0.0.0',
      optional: true,
    }),
    PRIVACY_POLICY_VERSION: envField.string({
      access: 'public',
      context: 'client',
      default: '1970-01-01',
      optional: true,
    }),
    /**
     * Set in Vitest config for unit tests
     */
    PLAYWRIGHT: envField.string({
      access: 'public',
      context: 'client',
      optional: true,
    }),
    VITEST: envField.string({
      access: 'public',
      context: 'client',
      optional: true,
    }),
    /**
     * Allow overriding default dev server port
     */
    DEV_SERVER_PORT: envField.number({
      access: 'public',
      context: 'client',
      default: 4321,
      optional: true,
    }),
    /**
     * Site uses ConvertKit for managing newsletter subscriptions
     */
    CONVERTKIT_API_KEY: envField.string({
      access: 'public',
      context: 'server',
      optional: false,
    }),
    CONVERTKIT_FORM_ID: envField.number({ // not currently used so set to secret
      access: 'secret',
      context: 'server',
      optional: false,
    }),
    /**
     * Vercel uses optional cron secret to prevent abuse of services
     */
    CRON_SECRET: envField.string({
      access: 'public',
      context: 'server',
      optional: false,
    }),
    /**
     * Site uses Vercel Upstash integration for rate limiting on API endpoints
     */
    KV_URL: envField.string({ // not currently used so set to secret
      access: 'secret',
      context: 'server',
      optional: false,
    }),
    KV_REST_API_URL: envField.string({
      access: 'public',
      context: 'server',
      optional: false,
    }),
    KV_REST_API_TOKEN: envField.string({
      access: 'public',
      context: 'server',
      optional: false,
    }),
    KV_REST_API_READ_ONLY_TOKEN: envField.string({ // not currently used so set to secret
      access: 'secret',
      context: 'server',
      optional: false,
    }),
    REDIS_URL: envField.string({ // not currently used
      access: 'secret',
      context: 'server',
      optional: false,
    }),
    /**
     * Site uses Resend for sending site emails
     */
    RESEND_API_KEY: envField.string({
      access: 'public',
      context: 'server',
      optional: false,
    }),
    /**
     * Site uses Sentry for monitoring site errors and user path tracing
     *
     * - Only used in code called by astro.config.ts, uses process.env
     * - Used to upload source maps during build
     */
    SENTRY_AUTH_TOKEN: envField.string({
      access: 'secret',
      context: 'server',
      optional: false,
    }),
    SENTRY_DSN: envField.string({
      access: 'public',
      context: 'client',
      optional: false, // Optional - Sentry only enabled if provided
    }),
    /**
     * Site uses Suprabase for managing GDPR consent records
     */
    SUPABASE_KEY: envField.string({
      access: 'public',
      context: 'client',
      optional: false,
    }),
    SUPABASE_URL: envField.string({
      access: 'public',
      context: 'client',
      optional: false,
    }),
    SUPABASE_SERVICE_ROLE_KEY: envField.string({
      access: 'public',
      context: 'server',
      optional: false,
    }),
    /**
     * Site uses ConvertKit for managing newsletter subscriptions
     */
    WEBMENTION_IO_TOKEN: envField.string({
      access: 'public',
      context: 'client',
      optional: false,
    }),
  },
  /**
   * By default, only public variables are validated on the server when starting the
   * dev server or a build, and private variables are validated at runtime only. If
   * enabled, private variables will also be checked on start. This is useful in some
   * continuous integration (CI) pipelines to make sure all your secrets are correctly
   * set before deploying.
   */
  validateSecrets: true,
}
