import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import vercelStatic from '@astrojs/vercel'
import sentry from '@sentry/astro'
import tailwindcss from '@tailwindcss/vite'
import AstroPWA from '@vite-pwa/astro'
import vtbot from 'astro-vtbot'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import type { PluginOption } from 'vite'
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
  isUnitTest,
  isVercel,
  markdownConfig,
  serviceWorkerConfig,
  vercelConfig,
} from './src/lib/config'
import { callToActionValidator } from './src/integrations/CtaValidator'
import { faviconGenerator } from './src/integrations/FaviconGenerator'
import { packageRelease } from './src/integrations/PackageRelease'
import { privacyPolicyVersion } from './src/integrations/PrivacyPolicyVersion'
import { createSerializeFunction, pagesJsonWriter } from './src/integrations/sitemapSerialize'

const sharedTestIntegrations = [
  icon(),
]

const standardIntegrations = [
  AstroPWA(serviceWorkerConfig),
  ...sharedTestIntegrations,
  mdx(markdownConfig),
  /** Generate favicons and PWA icons from source SVG */
  faviconGenerator(),
  /** Verify number of call to actions included in Markdown files */
  callToActionValidator({
    /** Enable debug logging to see validation details */
    debug: true,
  }),
  /** Inject package release (name@version) for tracking regressions between releases */
  packageRelease(),
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
]

export default defineConfig({
  adapter: vercelStatic(vercelConfig),
  devToolbar: {
    enabled: false,
  },
  env: environmentalVariablesConfig,
  /**
   * Astro sets substantial Vite config internally in the framework. When you use Vitest
   * in an Astro project, you use Astro's getViteConfig helper to get the resolved internal
   * Vite syntax along with any Vite syntax set in this astro.config.ts file. Since integrations
   * can change config, they're ran when the helper's called. This causes problems for
   * unit testing integrations.
   */
  integrations: isUnitTest() ? sharedTestIntegrations : standardIntegrations,
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
    define: {
      /**
       * LightningCSS exposes a WASM build via require('../pkg'), which Vite cannot
       * resolve when bundling for the browser. Setting this flag to false at build
       * time lets Rollup tree-shake the problematic branch.
       */
      'process.env.CSS_TRANSFORMER_WASM': 'false',
    },
    /* @ts-expect-error - tailwindcss plugin type compatibility */
    plugins: [
      tailwindcss(),
    ] as PluginOption[],
    resolve: {
      alias: {
        fsevents: fileURLToPath(new URL('./src/shims/fsevents.ts', import.meta.url)),
      },
    },
  }
})
