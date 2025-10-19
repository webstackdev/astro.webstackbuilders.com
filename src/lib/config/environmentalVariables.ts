import { envField } from 'astro/config'
import type { AstroUserConfig } from 'astro'

/**
 * Env var usage:
 *
 * import { SERVER_API_URL} from "astro:env/server";
 * <script>import { API_URL } from "astro:env/client";</script>
 */

export const environmentalVariablesConfig: AstroUserConfig['env'] = {
  schema: {
    /**
     * Public client variables end up in both the final client and server bundles, and can
     * be accessed from both client and server through the astro:env/client module. Public
     * server variables end up in the final server bundle. Secret server variables are not
     * part of the final server bundle and are only validated at runtime.
     */
    DEV_SERVER_PORT: envField.number({
      context: 'server',
      access: 'public',
      optional: true,
      default: 4321,
    }),
    CONVERTKIT_API_KEY: envField.string({
      context: 'server',
      access: 'secret',
      optional: false,
    }),
    CONVERTKIT_FORM_ID: envField.number({
      context: 'server',
      access: 'secret',
      optional: false,
    }),
    PREVIEW_SERVER_PORT: envField.number({
      context: 'server',
      access: 'public',
      optional: true,
      default: 4321,
    }),
    RESEND_API_KEY: envField.string({
      context: 'server',
      access: 'public',
      optional: false,
    }),
    SENTRY_AUTH_TOKEN: envField.string({
      context: 'server',
      access: 'secret',
      optional: true, // Only required for uploading source maps during build
    }),
    PUBLIC_SENTRY_DSN: envField.string({
      context: 'client',
      access: 'public',
      optional: true, // Optional - Sentry only enabled if provided
    }),
    WEBMENTION_IO_TOKEN: envField.string({
      context: 'server',
      access: 'secret',
      optional: true, // Optional - WebMentions only fetched if provided
    }),
  },
}
