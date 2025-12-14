import AstroPWA from '@vite-pwa/astro'
import db from '@astrojs/db'
import icon from 'astro-icon'
import linkValidator from 'astro-link-validator'
import lit from '@semantic-ui/astro-lit'
import mdx from '@astrojs/mdx'
import sentry from '@sentry/astro'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import vercelStatic from '@astrojs/vercel'
import vtbot from 'astro-vtbot'
import { defineConfig } from 'astro/config'
import type { AstroUserConfig } from 'astro'
import { fileURLToPath } from 'node:url'
import type { PluginOption } from 'vite'
/**
 * You cannot use path aliases (`@lib`, `@components`, etc.) in files that are
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
  isGitHub,
  isUnitTest,
  isVercel,
  markdownConfig,
  pwaConfig,
  vercelConfig,
} from './src/lib/config'
import { callToActionValidator } from './src/integrations/CtaValidator'
import { faviconGenerator } from './src/integrations/FaviconGenerator'
import { packageRelease } from './src/integrations/PackageRelease'
import { privacyPolicyVersion } from './src/integrations/PrivacyPolicyVersion'
import { pwaDevAssetServer } from './src/lib/plugins/pwaDevAssetServer'
import { createSerializeFunction, pagesJsonWriter } from './src/integrations/sitemapSerialize'

// Ensure Vite's HMR websocket connects through the same exposed dev server port used by Astro.
const devServerPort = Number(process.env['DEV_SERVER_PORT'] ?? 4321)

const sharedTestIntegrations = [
  icon(),
]

const standardIntegrations = [
  AstroPWA(pwaConfig),
  /** Astro DB - uses Tursa for backing store in production */
  db(),
  ...sharedTestIntegrations,
  mdx(markdownConfig),
  /** Generate favicons and PWA icons from source SVG */
  faviconGenerator(),
  /** Verify number of call to actions included in Markdown files */
  callToActionValidator({
    /** Enable debug logging to see validation details */
    debug: true,
  }),
  /** Integration to render Lit templates during build */
  lit(),
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
      exclude: ['downloads', '/articles/demo', 'testing'],
    }),
  }),
  /** Validate links in built site output on astro:build:done integration hook */
  linkValidator({
    checkExternal: isGitHub(),
    failOnBrokenLinks: false,
    verbose: true,
  }),
  /** Integration to write pages.json after build so E2E tests can discover what pages exist */
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
  markdown: markdownConfig as AstroUserConfig['markdown'],
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
  image: {
    remotePatterns: [
      { protocol: 'https' },
      { protocol: 'http' },
    ],
  },
  /** Change URL between development and production environments */
  site: getSiteUrl(),
  trailingSlash: 'never',
  vite: {
    server: {
      hmr: {
        clientPort: devServerPort,
      },
    },
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
      pwaDevAssetServer(),
    ] as PluginOption[],
    resolve: {
      alias: {
        fsevents: fileURLToPath(new URL('./src/shims/fsevents.ts', import.meta.url)),
      },
    },
  }
})
