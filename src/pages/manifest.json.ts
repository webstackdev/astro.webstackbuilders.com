/**
 * PWA Manifest
 * Returns the web app manifest for progressive web app functionality
 */
import type { APIRoute } from 'astro'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import { createApiFunctionContext } from '@pages/api/_utils/requestContext'
import contactData from '@content/contact.json'
import themeConfig from '@content/themes.json'

const ROUTE = '/manifest.json'
const FALLBACK_ERROR_MESSAGE = 'Unable to build PWA manifest.'

const buildManifestPayload = () => {
  const defaultThemeId = themeConfig.defaultTheme?.id
  const themes = themeConfig.themes || []
  const defaultTheme = themes.find(theme => theme.id === defaultThemeId) || themes[0]

  if (!defaultTheme) {
    throw new ApiFunctionError({
      message: 'No themes configured in themes.json; unable to build manifest.json',
      status: 500,
      code: 'MANIFEST_THEME_MISSING',
    })
  }

  /* eslint-disable camelcase */
  const manifest = {
    lang: 'en_US',
    dir: 'ltr',
    name: contactData.company.name,
    short_name: contactData.company.name,
    description: contactData.company.description,
    icons: [
      /** Mobile */
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      /** Desktop */
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      /**
       * Full-bleed image designed for Progressive Web Apps (PWAs) that allows the
       * operating system to crop it to match a specific shape, like a circle or
       * square, without a default background. This ensures the icon fills the entire
       * space provided for it on different Android devices and looks integrated with
       * the system's native icons.
       */
      {
        src: '/icon-mask.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    display_override: ['window-controls-overlay'],
    /**
     * Default color for the operating system and browser UI elements associated with
     * the PWA. Sets color on elements like the status bar on mobile devices, or the
     * title bar of a standalone app window on desktop operating systems.
     */
    theme_color: defaultTheme.colors.backgroundOffset,
    /**
     * Initial background color for the web application. Appears in the application
     * window before the application's stylesheets have loaded, providing a smooth
     * transition. Also used for the splash screen that appears in some browsers and
     * operating systems when an installed PWA is launched.
     */
    background_color: '#f3f4f6',
    start_url: '/index.html',
    display: 'standalone',
    orientation: 'natural',
    /**
     * Allows the PWA to be registered with the operating system as a destination for
     * content shared from other apps. When a user shares content, the PWA appears in the
     * share dialog, and the OS can launch the app to receive and process the data, such
     * as text, URLs, or files, as defined in the share_target property of the manifest.
     */
    /* eslint-disable jsdoc/no-bad-blocks */
    /*
      @TODO:
      share_target: {
        // URL for the web share target
        action: '/share/',
        method: 'GET', // or 'POST'
        // Ignored with GET, encoding for POST data
        enctype: 'application/x-www-form-urlencoded',
        params: {
          // Name of the query parameter to use for the title of the document being shared.
          title: 'title',
          // Name of the query parameter for the text (or body) of the message being shared.
          text: 'text',
          // Name of the query parameter for the URL to the resource being shared.
          url: 'url',
          // which files are accepted by the share target
          files: {
            // Name of the query parameter for the file being shared.
            name: '',
            // Accepted file types (MIME types or file extensions)
            accept: ['image/*', 'video/*'],
          }
        },
      },
    */
    /* eslint-enable jsdoc/no-bad-blocks */
  }
  /* eslint-enable camelcase */

  return manifest
}

/**
 * GET endpoint for the web app manifest
 * @returns Response with manifest JSON
 */
export const GET: APIRoute = async ({ request, cookies, clientAddress }) => {
  const { context } = createApiFunctionContext({
    route: ROUTE,
    operation: 'GET',
    request,
    cookies,
    clientAddress,
  })

  try {
    const manifest = buildManifestPayload()
    return new Response(JSON.stringify(manifest), {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    })
  } catch (error) {
    const apiError = handleApiFunctionError(error, context)
    return buildApiErrorResponse(apiError, {
      fallbackMessage: FALLBACK_ERROR_MESSAGE,
    })
  }
}
