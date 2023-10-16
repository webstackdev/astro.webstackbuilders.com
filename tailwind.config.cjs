/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('tailwindcss').Config} */
module.exports = {
  /* Use our own global reset based on Tailwind Preflight */
  corePlugins: {
    preflight: false,
  },
  content: ['./src/**/*.{astro,ts,tsx,md,mdx}'],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')({
      strategy: 'base',
    }),
  ],
}
