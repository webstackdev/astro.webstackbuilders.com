import eslint from '@eslint/js'
import astroPlugin from 'eslint-plugin-astro'
import importPlugin from 'eslint-plugin-import'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import securityPlugin from 'eslint-plugin-security'
import ymlPlugin from 'eslint-plugin-yml'
import tsPlugin from 'typescript-eslint'
import restrictedGlobals from 'confusing-browser-globals'
import enforceCentralizedEventsRule from './test/eslint/enforce-centralized-events-rule.ts'
import noHtmlElementAssertionsRule from './test/eslint/no-html-element-assertions-rule.ts'
import noQuerySelectorOutsideSelectorsRule from './test/eslint/no-query-selector-outside-selectors-rule.ts'

const level = 'error'

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
    plugins: {
      'custom-rules': {
        rules: {
          'enforce-centralized-events': enforceCentralizedEventsRule,
          'no-html-element-assertions': noHtmlElementAssertionsRule,
          'no-query-selector-outside-selectors': noQuerySelectorOutsideSelectorsRule,
        },
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.astro'],
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
       * Custom ESLint rules
       */
      'custom-rules/enforce-centralized-events': 'error',
      'custom-rules/no-html-element-assertions': 'error',
      'custom-rules/no-query-selector-outside-selectors': 'off', // TODO: Enable after extracting selectors
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
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_|^this$' },
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
            '^\\./.*',    // Ignore relative imports (let TypeScript handle these)
          ],
        },
      ],
      'import/no-webpack-loader-syntax': level,
      'import/extensions': [
        level,
        'ignorePackages', // Ignores extensions for packages
        {
          'js': 'never',
          'jsx': 'always',
          'ts': 'never',
          'tsx': 'always',
          'mjs': 'always',
          'cjs': 'always',
          'astro': 'always',
          'json': 'always',
          'svg': 'always',
        },
      ],
      'import/order': 'off',
      'jsdoc/check-indentation': level,
      'jsdoc/check-line-alignment': level,
      'jsdoc/check-syntax': level,
      'jsdoc/check-tag-names': [
        level,
        {
          definedTags: ['NOTE:', 'jest-environment', 'jest-environment-options'],
          jsxTags: true,
        },
      ],
      'jsdoc/match-description': 'off',
      'jsdoc/multiline-blocks': 'off',
      'jsdoc/newline-after-description': 'off',
      'jsdoc/no-bad-blocks': level,
      'jsdoc/no-defaults': level,
      'jsdoc/no-types': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/tag-lines': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-type': 'off',
      'jsdoc/valid-types': 'off',
      'new-cap': [level, { newIsCap: true, capIsNew: false }],
      'no-new': level,
      'no-restricted-globals': ['error'].concat(restrictedGlobals),
      'no-restricted-imports': [
        'error', {
            patterns: [
              {
                group: ['../*'],
                message: 'Usage of relative imports is not allowed. Please use path aliases.',
              },
            ],
          },
      ],
      'no-unused-expressions': [level, { allowShortCircuit: true, allowTernary: true }],
      'no-unused-vars': [level, { varsIgnorePattern: '^_', argsIgnorePattern: '^_|^this$' }],
      'no-useless-escape': 'off',
      'prefer-arrow-callback': 'off',
      'prefer-object-spread': level,
      'prefer-spread': level,
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-unsafe-regex': 'off',
      semi: ['error', 'never'],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
  {
    files: ['src/components/scripts/assertions/elements.ts'],
    rules: {
      // This file implements type guards and legitimately needs type assertions
      'custom-rules/no-html-element-assertions': 'off',
    },
  },
  {
    files: ['**/*error.spec.ts'],
    rules: {
      // Error test files use mock objects which legitimately need type assertions
      'custom-rules/no-html-element-assertions': 'off',
    },
  },
  {
    files: [
      'src/components/scripts/elementListeners/index.ts',
      'src/components/Social/Shares/client.ts', // Needs direct addEventListener for pause/resume/reset lifecycle
    ],
    rules: {
      'custom-rules/enforce-centralized-events': 'off',
    },
  },
  {
    files: [
      // Database files that use snake_case for database field names
      'src/components/scripts/consent/db/__tests__/rls.spec.ts',
      'src/pages/api/gdpr/consent.ts',
      'src/pages/api/gdpr/request-data.ts',
      'src/pages/api/gdpr/verify.ts',
      'src/pages/api/newsletter/_token.ts',
    ],
    rules: {
      camelcase: 'off',
    },
  },
]
