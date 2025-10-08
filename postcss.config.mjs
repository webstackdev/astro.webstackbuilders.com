/**
 * Tailwind v4 can be implemented either using a Vite plugin or using a PostCSS plugin. It
 * uses Lightning CSS (written in Rust) as a compiler. It does not yet have a CSS minifier.
 * Astro comes with PostCSS included as part of Vite. Creating a postcss.config.mjs file in
 * the project root will configure PostCSS for the project.
 *
 * Tailwind CSS v4's new architecture aims to reduce reliance on PostCSS for core functionalities.
 * The new Oxide engine, built in Rust and based on Lightning CSS, handles many tasks previously
 * managed by PostCSS plugins like postcss-import and autoprefixer.
 */

/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    ...(process.env['NODE_ENV'] === 'production' ? { cssnano: {} } : {}),
    'postcss-import': {}, // Ensures CSS imports are bundled correctly
    autoprefixer: {},
  }
}
