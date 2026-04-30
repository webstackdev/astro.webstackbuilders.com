import db from '@astrojs/db'
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
import { createLogger, type LogOptions, type PluginOption } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
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
  getSiteUrl,
  isE2eTest,
  markdownConfig,
  pwaConfig,
  vercelConfig,
} from './src/lib/config'
import { callToActionValidator } from './src/integrations/CtaValidator'
import { faviconGenerator } from './src/integrations/FaviconGenerator'
import { privacyPolicyVersion } from './src/integrations/PrivacyPolicyVersion'
import { getPackageRelease, packageRelease } from './src/integrations/PackageRelease'
import { testimonialsLengthWarning } from './src/integrations/TestimonialsLengthWarning'
import { fixContentAssetPropagation } from './src/lib/plugins/fixContentAssetPropagation'
import { pwaDevAssetServer } from './src/lib/plugins/pwaDevAssetServer'
import { createSerializeFunction, pagesJsonWriter } from './src/integrations/sitemapSerialize'

// Ensure Vite's HMR websocket connects through the same exposed dev server port used by Astro.
const devServerPort = Number(process.env['DEV_SERVER_PORT'] ?? 4321)
const viteLogger = createLogger(undefined, { allowClearScreen: false })
const sentryAuthToken = process.env['SENTRY_AUTH_TOKEN']
const shouldEnableSentryIntegration = Boolean(sentryAuthToken)
const sentryReleaseName = getPackageRelease()
const astroEnvConfig = environmentalVariablesConfig as NonNullable<AstroUserConfig['env']>
const astroMarkdownConfig = markdownConfig as unknown as NonNullable<AstroUserConfig['markdown']>

const shouldSuppressViteWarning = (message: string): boolean => {
  return (
    /resolve\.alias.*customResolver option/i.test(message) ||
    (
      /externalized for browser compatibility/i.test(message) &&
      /node_modules\/(?:@astrojs\/vercel|@astrojs\/internal-helpers|@vercel\/|esbuild\/lib\/main\.js|@mapbox\/node-pre-gyp|node-gyp-build|detect-libc|graceful-fs|bindings|resolve-from|file-uri-to-path|nopt)\//i.test(message)
    )
  )
}

const shouldSuppressRollupWarning = (warning: {
  code?: string | undefined
  plugin?: string | undefined
}): boolean => {
  return (
    warning.code === 'SOURCEMAP_BROKEN' &&
    warning.plugin === '@tailwindcss/vite:generate:build'
  )
}

const standardIntegrations = [
  /** Astro DB - uses Tursa for backing store in production */
  db(),
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
  /** Warn when testimonial bodies are too short/too long (helps keep carousel cards consistent) */
  testimonialsLengthWarning({ min: 300, max: 400 }),
  /** Enable Sentry build integration when CI provides upload credentials. */
  ...(shouldEnableSentryIntegration && sentryAuthToken ? [sentry({
    enabled: {
      client: false,
      server: true,
    },
    project: 'webstack-builders-corporate-website',
    org: 'webstack-builders',
    authToken: sentryAuthToken,
    unstable_sentryVitePluginOptions: {
      release: {
        name: sentryReleaseName,
      },
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/client/**/*.map', './dist/**/server/**/*.map'],
      },
    },
  })] : []),
  sitemap({
    serialize: createSerializeFunction({
      exclude: ['deep-dive', 'downloads', 'print', '/articles/demo', 'testing', 'hero', 'links'],
    }),
  }),
  /**
   * Validate links in built site output on astro:build:done integration hook. Ran locally
   * and on GitHub production builds because links can't be determined at build time in
   * GitHub preview environments.
   */
  //...(isDev() || isProd() ? [linkValidatorPlugin] : []),
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
  env: astroEnvConfig,
  markdown: astroMarkdownConfig,
  /**
   * Astro sets substantial Vite config internally in the framework. When you use Vitest
   * in an Astro project, you use Astro's getViteConfig helper to get the resolved internal
   * Vite syntax along with any Vite syntax set in this astro.config.ts file. Since integrations
   * can change config, they're ran when the helper's called. This causes problems for
   * unit testing integrations.
   */
  integrations: standardIntegrations,
  /** Astro actions require server output in Astro 6. Individual routes can still opt into prerendering. */
  output: 'server',
  prefetch: process.env['DISABLE_PREFETCH'] === '1' ? false : true,
  image: {
    remotePatterns: [
      { protocol: 'https' },
      { protocol: 'http' },
    ],
  },
  redirects: {
    '/tags': '/articles',
  },
  /** Change URL between development and production environments */
  site: getSiteUrl(),
  trailingSlash: 'never',
  vite: {
    customLogger: {
      ...viteLogger,
      warn: (message: string, options?: LogOptions) => {
        if (shouldSuppressViteWarning(message)) return
        viteLogger.warn(message, options)
      },
    },
    server: {
      hmr: {
        clientPort: devServerPort,
      },
    },
    optimizeDeps: {
      /**
       * Force Vite dependency pre-bundling during Playwright E2E runs.
       * This avoids flaky dev-server behavior where optimized deps can be stale or served inconsistently.
       */
      force: isE2eTest(),
      /**
       * Explicitly include known problematic ESM entrypoints so they're always pre-bundled.
       * Related historical flake: optimized Lit directive module served with incorrect MIME type.
       */
      include: ['lit', 'lit/directives/if-defined.js'],
    },
    /**
     * Astro 6 reads `environments.client.build.sourcemap` for client bundles
     * instead of the top-level `build.sourcemap` (which only affects server).
     * Use 'hidden' to generate .map files without adding //# sourceMappingURL
     * comments, so maps are available for Sentry upload but not exposed to users.
     */
    environments: {
      client: {
        build: {
          sourcemap: 'hidden',
        },
      },
    },
    build: {
      /** Server source maps for Sentry. */
      sourcemap: 'hidden',
      rollupOptions: {
        onwarn(warning, warn) {
          if (shouldSuppressRollupWarning(warning)) return
          warn(warning)
        },
      },
    },
    define: {
      /**
       * LightningCSS exposes a WASM build via require('../pkg'), which Vite cannot
       * resolve when bundling for the browser. Setting this flag to false at build
       * time lets Rollup tree-shake the problematic branch.
       */
      'process.env.CSS_TRANSFORMER_WASM': 'false',
    },
    plugins: [
      fixContentAssetPropagation(),
      tailwindcss(),
      VitePWA(pwaConfig),
      pwaDevAssetServer(),
    ] as PluginOption[],
    resolve: {
      alias: {
        fsevents: fileURLToPath(new URL('./src/shims/fsevents.ts', import.meta.url)),
      },
    },
  },
})
