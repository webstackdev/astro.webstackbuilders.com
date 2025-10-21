/**
 * PWA Manifest
 * Returns the web app manifest for progressive web app functionality
 */
import company from '@content/company'

/**
 * GET endpoint for the web app manifest
 * @returns Response with manifest JSON
 */
export function GET() {
  /* eslint-disable camelcase */
  const manifest = {
    lang: 'en_US',
    dir: 'ltr',
    name: company.name,
    short_name: company.name,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-mask.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    display_override: ['window-controls-overlay'],
    theme_color: '#1a1a1a',
    background_color: '#1a1a1a',
    start_url: '/index.html',
    display: 'standalone',
    orientation: 'natural',
    share_target: {
      action: '/share/',
      method: 'GET',
      enctype: 'application/x-www-form-urlencoded',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
  }
  /* eslint-enable camelcase */

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  })
}
