/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('tailwindcss').Config} */
module.exports = {
  /* Use our own global reset based on Tailwind Preflight */
  corePlugins: {
    preflight: false,
  },
  content: ['./src/**/*.{astro,ts,tsx,md,mdx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      brandPrimary: '#00539f',
      'slate-100': '#f8fcfd',
      'slate-300': '#a1a1a1',
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')({
      strategy: 'base',
    }),
  ],
}
