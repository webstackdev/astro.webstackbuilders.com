/**
 * Tailwind v4 can be implemented either using a Vite plugin or using a PostCSS plugin. It
 * uses Lightning CSS (written in Rust) as a compiler. It does not yet have a CSS minifier.
 * Astro comes with PostCSS included as part of Vite. Creating a postcss.config.cjs file in
 * the project root will configure PostCSS for the project.
 */

/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    ...(process.env['NODE_ENV'] === 'production' ? { cssnano: {} } : {}),
  }
}
