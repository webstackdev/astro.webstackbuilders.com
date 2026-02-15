import type { PwaOptions } from '@vite-pwa/astro'
import contactData from '../../content/contact.json'
import themeConfig from '../../content/themes.json'

const buildThemeColor = (): string => {
  const themes = themeConfig.themes || []
  const defaultThemeId = themeConfig.defaultTheme?.id
  const defaultTheme = themes.find(theme => theme.id === defaultThemeId) || themes[0]

  return defaultTheme?.colors?.backgroundOffset || '#111827'
}

const manifestThemeColor = buildThemeColor()

export const pwaConfig: PwaOptions = {
  mode: 'production',
  strategies: 'injectManifest',
  srcDir: 'src/lib/workbox',
  filename: 'index.ts',
  base: '/',
  scope: '/',
  includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
  devOptions: {
    enabled: true,
    navigateFallbackAllowlist: [/./],
  },
  manifestFilename: 'manifest.json',
  registerType: 'autoUpdate',
  /**
   * Options for manifest.json generation
   */
  manifest: {
    background_color: '#f3f4f6',
    description: contactData.company.description,
    dir: 'ltr',
    display_override: ['window-controls-overlay'],
    display: 'browser',
    lang: 'en_US',
    name: contactData.company.name,
    orientation: 'natural',
    /** Make the app non-installable as a stand-alone PWA */
    prefer_related_applications: true,
    short_name: contactData.company.name,
    start_url: '/index.html',
    theme_color: manifestThemeColor,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-mask.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  injectManifest: {
    // ensure the offline page is always available for navigation fallback
    additionalManifestEntries: [{ url: '/offline', revision: null }],
  },
}
