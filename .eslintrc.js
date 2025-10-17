import eslint from "@eslint/js"
import astroPlugin from "eslint-plugin-astro"
import importPlugin from "eslint-plugin-import"
import jsdocPlugin from "eslint-plugin-jsdoc"
import securityPlugin from "eslint-plugin-security"
import ymlPlugin from "eslint-plugin-yml"
import tsPlugin from "typescript-eslint"
import restrictedGlobals from "confusing-browser-globals"

// eslint-disable-next-line no-undef
const level = process.env["NODE_ENV"] === "production" ? "error" : "warn"

export default [
  eslint.configs.strict,
  ...tsPlugin.configs.strict,
  ...astroPlugin.configs.recommended,
  ...astroPlugin.configs['jsx-a11y-strict'],
  importPlugin.flatConfigs.recommended,
  jsdocPlugin.configs['flat/recommended-typescript'],
  securityPlugin.configs.recommended,
  ...ymlPlugin.configs['flat/recommended'],
  {
    /** No globals are enabled for ESLint by default: 'writable', 'readonly', or 'off'. */
    globals: {
      NodeJS: 'readonly',
    },
    env: {
      browser: true,
      commonjs: true,
      es6: true,
      node: true,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      /**
       * Common rule settings for all linted files
       */
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/ban-types': level,
      '@typescript-eslint/consistent-type-assertions': [
        level,
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow-as-parameter' },
      ],
      /**
       * Avoid un-fixable lint errors reported within .js/.jsx files
       * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-module-boundary-types.md
       */
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': [
        level,
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-var-requires': level,
      /** Prohibits using a type assertion that does not change the type of an expression. */
      '@typescript-eslint/no-unnecessary-type-assertion': level,
      '@typescript-eslint/restrict-template-expressions': 'off',
      /** Continue allowing triple-slash refs, TS wants to use 'import' syntax instead */
      '@typescript-eslint/triple-slash-reference': 'off',
      /** Issue with Prettier https://github.com/prettier/eslint-plugin-prettier/issues/65: */
      'arrow-body-style': 'off',
      camelcase: [level],
      curly: [level, 'all'],
      /** eslint-plugin-comments */
      'eslint-comments/no-unused-disable': level,
      /** eslint-plugin-import */
      'import/no-unresolved': level,
      'import/no-webpack-loader-syntax': level,
      'import/order': 'off',
      /** eslint-plugin-jsdoc */
      'jsdoc/check-indentation': level,
      'jsdoc/check-line-alignment': level,
      'jsdoc/check-syntax': level,
      'jsdoc/check-tag-names': [
        level,
        {
          definedTags: ['NOTE:', 'TODO:', 'jest-environment', 'jest-environment-options'],
          jsxTags: true,
        },
      ],
      /** Applies a regex to description so that it's text-only starting with a capital */
      'jsdoc/match-description': 'off',
      'jsdoc/no-bad-blocks': level,
      'jsdoc/no-defaults': level,
      'jsdoc/no-types': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-type': 'off',
      /** JSDoc does not support import() for typedefs */
      'jsdoc/valid-types': 'off',
      'new-cap': [level, { newIsCap: true, capIsNew: false }],
      'no-new': level,
      'no-restricted-globals': ['error'].concat(restrictedGlobals),
      'no-unused-expressions': [level, { allowShortCircuit: true, allowTernary: true }],
      'no-unused-vars': [level, { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'no-useless-escape': 'off',
      /** Issue with Prettier https://github.com/prettier/eslint-plugin-prettier/issues/65: */
      'prefer-arrow-callback': 'off',
      'prefer-object-spread': level,
      'prefer-spread': level,
      /** Getting false positives on HTMLElement.classList.add/.remove methods */
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-unsafe-regex': 'off',
      /** Too many false positives from using @TODO and no way to add add'l tags to rule */
      'tsdoc/syntax': 'off', // eslint-disable-line jsdoc/escape-inline-tags
    }
  }
]
