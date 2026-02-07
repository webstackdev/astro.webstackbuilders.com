import type { Plugin, PluginOption } from 'vite'

/**
 * Workaround for a known Astro bug where `@astrojs/db` + `@astrojs/mdx` causes
 * build failures in the `astro:content-asset-propagation` Vite plugin.
 *
 * Root cause: During `astro:build:setup`, the DB integration creates a temporary
 * Vite server (for seed file execution) via `createServer()`. This temp server
 * shares the same plugin objects as the main build and calls `configureServer`
 * on them, which sets `devModuleLoader` on the content-asset-propagation plugin.
 * The temp server uses `ssr: { external: [] }` (nothing externalized), so when
 * the main build's `transform` phase later uses this contaminated `devModuleLoader`
 * to evaluate MDX modules standalone, a circular dependency between Astro's
 * `server/index.js` and `jsx.js` triggers a Temporal Dead Zone error:
 *
 * `Cannot access '__vite_ssr_import_8__' before initialization`
 *
 * Fix: During build, wrap the content-asset-propagation plugin's `transform` to
 * force `options.ssr = false`, which skips the `devModuleLoader` code path and
 * uses the placeholder strategy instead. The placeholders are later replaced
 * with actual CSS/JS by the `astroConfigBuildPlugin` in the post-build phase,
 * which is the correct build behavior.
 *
 * Related issues:
 * - https://github.com/withastro/astro/issues/13085
 * - https://github.com/withastro/astro/issues/13152
 */
type TransformFn = (
  this: unknown,
  _code: string,
  _id: string,
  _options?: { ssr?: boolean },
) => unknown

export function fixContentAssetPropagation(): PluginOption {
  return {
    name: 'fix-content-asset-propagation',
    configResolved(config) {
      if (config.command !== 'build') return
      const plugin = config.plugins.find(
        (p: Plugin) => p.name === 'astro:content-asset-propagation',
      )
      if (!plugin?.transform) return
      const originalTransform = (plugin.transform as TransformFn).bind(plugin) as TransformFn
      const pluginRecord = plugin as unknown as Record<string, unknown>
      pluginRecord['transform'] = function (
        this: unknown,
        code: string,
        id: string,
        options?: { ssr?: boolean },
      ) {
        // Force non-SSR path to avoid devModuleLoader, which was contaminated
        // by the DB integration's temp server during astro:build:setup.
        return originalTransform.call(this, code, id, { ...options, ssr: false })
      }
    },
  }
}
