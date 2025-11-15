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
 * Public client variables: Available in both client and server bundles.
 * Public server variables: Only available in the server bundle.
 * Secret server variables: Only available in the server bundle and not included in the final bundle.
 */

export const environmentalVariablesConfig: AstroUserConfig['env'] = {
  schema: {
    DEV_SERVER_PORT: envField.number({
      context: 'client',
      access: 'public',
      optional: true,
      default: 4321,
    }),
    /**
     * Site uses ConvertKit for managing newsletter subscriptions
     */
    CONVERTKIT_API_KEY: envField.string({
      context: 'server',
      access: 'public',
      optional: false,
    }),
    CONVERTKIT_FORM_ID: envField.number({
      context: 'server',
      access: 'public',
      optional: false,
    }),
    /**
     * Vercel uses optional cron secret to prevent abuse of services
     */
    CRON_SECRET: envField.string({
      context: 'server',
      access: 'public',
      optional: false,
    }),
    /**
     * Site uses Vercel Upstash integration for rate limiting on API endpoints
     */
    KV_URL: envField.string({
      context: 'server',
      access: 'public',
      optional: false,
    }),
    KV_REST_API_URL: envField.string({
      context: 'server',
      access: 'public',
      optional: false,
    }),
    KV_REST_API_TOKEN: envField.string({
      context: 'server',
      access: 'secret',
      optional: false,
    }),
    KV_REST_API_READ_ONLY_TOKEN: envField.string({
      context: 'server',
      access: 'public',
      optional: false,
    }),
    REDIS_URL: envField.string({
      context: 'server',
      access: 'public',
      optional: false,
    }),
    /**
     * Site uses Resend for sending site emails
     */
    RESEND_API_KEY: envField.string({
      context: 'server',
      access: 'public',
      optional: false,
    }),
    /**
     * Site uses Sentry for monitoring site errors and user path tracing
     */
    SENTRY_AUTH_TOKEN: envField.string({
      context: 'server',
      access: 'public',
      optional: false, // Only required for uploading source maps during build
    }),
    PUBLIC_SENTRY_DSN: envField.string({
      context: 'client',
      access: 'public',
      optional: false, // Optional - Sentry only enabled if provided
    }),
    /**
     * Site uses Suprabase for managing GDPR consent records
     */
    PUBLIC_SUPABASE_URL: envField.string({
      context: 'client',
      access: 'public',
      optional: false,
    }),
    PUBLIC_SUPABASE_KEY: envField.string({
      context: 'server',
      access: 'public',
      optional: false,
    }),
    SUPABASE_SERVICE_ROLE_KEY: envField.string({
      context: 'server',
      access: 'secret',
      optional: false,
    }),
    /**
     * Site uses ConvertKit for managing newsletter subscriptions
     */
    WEBMENTION_IO_TOKEN: envField.string({
      context: 'server',
      access: 'secret',
      optional: false,
    }),
  },
}
