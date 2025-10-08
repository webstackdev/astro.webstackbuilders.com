/**
 * Tailwind v4 can be implemented either using a Vite plugin or using a PostCSS plugin. It
 * uses Lightning CSS (written in Rust) as a compiler. It does not yet have a CSS minifier.
 * Astro comes with PostCSS included as part of Vite. Creating a postcss.config.mjs file in
 * the project root will configure PostCSS for the project.
 */

/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    ...(process.env['NODE_ENV'] === 'production' ? { cssnano: {} } : {}),
    tailwindcss: {},
    autoprefixer: {},
    'postcss-import': {}, // Ensures CSS imports are bundled correctly
    'tailwindcss/nesting': {}, // Use this plugin to enable SCSS-style nesting
  }
}
