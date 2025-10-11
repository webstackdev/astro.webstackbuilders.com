import eslint from "@eslint/js"
import astroPlugin from "eslint-plugin-astro"
import importPlugin from "eslint-plugin-import"
import jsdocPlugin from "eslint-plugin-jsdoc"
import securityPlugin from "eslint-plugin-security"
import ymlPlugin from "eslint-plugin-yml"
import tsPlugin from "typescript-eslint"
import restrictedGlobals from "confusing-browser-globals"

const level = process.env["NODE_ENV"] === "production" ? "error" : "warn"

export default [
  eslint.configs.recommended,
  ...tsPlugin.configs.recommended,
  ...astroPlugin.configs.recommended,
  ...astroPlugin.configs['jsx-a11y-strict'],
  importPlugin.flatConfigs.recommended,
  jsdocPlugin.configs['flat/recommended-typescript'],
  securityPlugin.configs.recommended,
  ...ymlPlugin.configs['flat/recommended'],
  {
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        NodeJS: 'readonly',
      },
    },
    rules: {
      /**
       * Common rule settings for all linted files
       */
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-type-assertions': [
        level,
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow-as-parameter' },
      ],
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
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      'arrow-body-style': 'off',
      camelcase: [level],
      curly: 'off',
      'import/no-unresolved': [
        level,
        {
          ignore: [
            '^astro:.*',  // Ignore Astro virtual modules
          ],
        },
      ],
      'import/no-webpack-loader-syntax': level,
      'import/order': 'off',
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
      'jsdoc/match-description': 'off',
      'jsdoc/multiline-blocks': 'off',
      'jsdoc/newline-after-description': 'off',
      'jsdoc/no-bad-blocks': level,
      'jsdoc/no-defaults': level,
      'jsdoc/no-types': 'off',
      'jsdoc/tag-lines': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-type': 'off',
      'jsdoc/valid-types': 'off',
      'new-cap': [level, { newIsCap: true, capIsNew: false }],
      'no-new': level,
      'no-restricted-globals': ['error'].concat(restrictedGlobals),
      'no-unused-expressions': [level, { allowShortCircuit: true, allowTernary: true }],
      'no-unused-vars': [level, { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'no-useless-escape': 'off',
      'prefer-arrow-callback': 'off',
      'prefer-object-spread': level,
      'prefer-spread': level,
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-unsafe-regex': 'off',
    }
  }
]
