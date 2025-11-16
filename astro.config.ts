import mdx from '@astrojs/mdx'
import preact from '@astrojs/preact'
import sitemap from '@astrojs/sitemap'
import vercelStatic from '@astrojs/vercel'
import sentry from "@sentry/astro"
import tailwindcss from '@tailwindcss/vite'
import AstroPWA from '@vite-pwa/astro'
import vtbot from 'astro-vtbot'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'
/**
 * You cannot use path aliases (@lib, @components, etc.) in files that are
 * imported by astro.config.ts, because the path alias resolution happens
 * AFTER the config is loaded, not before. This means that adding resolve.alias
 * paths to the vite section in astro.config.ts would not allow using path
 * aliases because it creates a circular dependency problem since the config
 * file itself is importing from the paths it needs to configure.
 */
import {
  environmentalVariablesConfig,
  getSentryAuthToken,
  getSiteUrl,
  isVercel,
  markdownConfig,
  serviceWorkerConfig,
  vercelConfig,
} from './src/lib/config'
import { callToActionValidator } from './src/integrations/CtaValidator'
import { privacyPolicyVersion } from './src/integrations/PrivacyPolicyVersion'
import { createSerializeFunction, pagesJsonWriter } from './src/integrations/sitemapSerialize'

export default defineConfig({
  adapter: vercelStatic(vercelConfig),
  devToolbar: {
    enabled: false,
  },
  env: environmentalVariablesConfig,
  integrations: [
    AstroPWA(serviceWorkerConfig),
    icon(),
    mdx(markdownConfig),
    preact({ devtools: true }),
    /** Verify number of call to actions included in Markdown files */
    callToActionValidator({
      /** Enable debug logging to see validation details */
      debug: true
    }),
    /** Inject privacy policy version from git commit date for GDPR record keeping */
    privacyPolicyVersion(),
    /** Only include Sentry integration in Vercel environments */
    ...(isVercel() ? [sentry({
      project: "webstack-builders-corporate-website",
      org: "webstack-builders",
      authToken: getSentryAuthToken(),
    })] : []),
    sitemap({
      serialize: createSerializeFunction({
        exclude: ['downloads', 'social-shares', '/articles/demo'],
      }),
    }),
    pagesJsonWriter(),
    /** Debugging tools for Astro View Transition API */
    vtbot(),
  ],
  /** API routes are marked in their files for SSR */
  output: 'static',
  prefetch: true,
  /** Change URL between development and production environments */
  site: getSiteUrl(),
  trailingSlash: 'never',
  vite: {
    build: {
      /** Source map generation must be turned on for Sentry. */
      sourcemap: true,
    },
    /* @ts-expect-error - tailwindcss plugin type compatibility */
    plugins: [tailwindcss()],
    /**
     * Note: The "astro:transitions sourcemap" warning is cosmetic and can be safely
     * ignored. It occurs because the transitions plugin transforms code without
     * generating sourcemaps. This doesn't affect build functionality, runtime
     * performance, or debugging capabilities
     */
  }
})
