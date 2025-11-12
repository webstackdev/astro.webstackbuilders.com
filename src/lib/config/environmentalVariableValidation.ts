import { envField } from 'astro/config'
import type { AstroUserConfig } from 'astro'

/**
 * Env var usage:
 *
 * import { SERVER_API_URL} from "astro:env/server";
 * <script>import { API_URL } from "astro:env/client";</script>
 *
 * Public client variables end up in both the final client and server bundles, and can
 * be accessed from both client and server through the astro:env/client module. Public
 * server variables end up in the final server bundle. Secret server variables are not
 * part of the final server bundle and are only validated at runtime.
 */

export const environmentalVariablesConfig: AstroUserConfig['env'] = {
  schema: {
    DEV_SERVER_PORT: envField.number({
      context: 'server',
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
      optional: true,
    }),
    /**
     * Site uses Vercel Upstash integration for rate limiting on API endpoints
     */
    KV_URL: envField.string({
      context: 'server',
      access: 'public',
      optional: true,
    }),
    KV_REST_API_URL: envField.string({
      context: 'server',
      access: 'public',
      optional: true,
    }),
    KV_REST_API_TOKEN: envField.string({
      context: 'server',
      access: 'public',
      optional: true,
    }),
    KV_REST_API_READ_ONLY_TOKEN: envField.string({
      context: 'server',
      access: 'public',
      optional: true,
    }),
    REDIS_URL: envField.string({
      context: 'server',
      access: 'public',
      optional: true,
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
      optional: true, // Only required for uploading source maps during build
    }),
    PUBLIC_SENTRY_DSN: envField.string({
      context: 'client',
      access: 'public',
      optional: true, // Optional - Sentry only enabled if provided
    }),
    /**
     * Site uses Suprabase for managing GDPR consent records
     */
    PUBLIC_SUPABASE_URL: envField.string({
      context: 'client',
      access: 'public',
      optional: true,
    }),
    PUBLIC_SUPABASE_KEY: envField.string({
      context: 'server',
      access: 'public',
      optional: true,
    }),
    SUPABASE_SERVICE_ROLE_KEY: envField.string({
      context: 'server',
      access: 'secret',
      optional: true,
    }),
    /**
     * Site uses ConvertKit for managing newsletter subscriptions
     */
    WEBMENTION_IO_TOKEN: envField.string({
      context: 'server',
      access: 'secret',
      optional: true, // Optional - WebMentions only fetched if provided
    }),
  },
}
