/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    ...(import.meta.env.PROD ? { cssnano: {} } : {}),
  }
}
