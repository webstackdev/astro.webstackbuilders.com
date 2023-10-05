/* eslint-env node */
module.exports = {
  extends: ['plugin:astro/recommended', 'plugin:@typescript-eslint/recommended', 'plugin:jsx-a11y/recommended'],
  plugins: ['@typescript-eslint'],
  root: true,
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        ecmaVersion: 'latest',
        extraFileExtensions: ['.astro'],
        parser: '@typescript-eslint/parser',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        // "astro/no-set-html-directive": "error"
      },
    },
  ],
}
