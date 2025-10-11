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
      context: "server",
      access: "public",
      optional: true,
      default: 4321,
    }),
    PREVIEW_SERVER_PORT: envField.number({
      context: "server",
      access: "public",
      optional: true,
      default: 4321,
    }),
  }
}
