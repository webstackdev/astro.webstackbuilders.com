import eslint from '@eslint/js'
import astroPlugin from 'eslint-plugin-astro'
import importPlugin from 'eslint-plugin-import'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import securityPlugin from 'eslint-plugin-security'
import ymlPlugin from 'eslint-plugin-yml'
import tsPlugin from 'typescript-eslint'
import restrictedGlobals from 'confusing-browser-globals'
import enforceCentralizedEventsRule from './test/eslint/enforce-centralized-events-rule'
import noHtmlElementAssertionsRule from './test/eslint/no-html-element-assertions-rule'
import noQuerySelectorOutsideSelectorsRule from './test/eslint/no-query-selector-outside-selectors-rule'

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
      '@typescript-eslint/no-unsafe-function-type': level,
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': [
        level,
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_|^this$' },
      ],
      '@typescript-eslint/no-empty-object-type': level,
      '@typescript-eslint/no-var-requires': level,
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-wrapper-object-types': level,
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      /** Issue with Prettier https://github.com/prettier/eslint-plugin-prettier/issues/65: */
      'arrow-body-style': 'off',
      'camelcase': [level],
      'curly': 'off',
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
      'import/no-restricted-paths': [
        level,
        {
          zones: [
            {
              target: 'src/components/',
              from: 'src/lib/',
              message: 'The src/lib directory is for build-time code only.',
            },
            {
              target: 'src/layouts/',
              from: 'src/lib/',
              message: 'The src/lib directory is for build-time code only.',
            },
            {
              target: 'src/pages/',
              from: 'src/lib/',
              message: 'The src/lib directory is for build-time code only.',
            },
          ],
        },
      ],
      'import/order': 'off',
      'jsdoc/check-indentation': level,
      'jsdoc/check-line-alignment': level,
      'jsdoc/check-syntax': level,
      'jsdoc/check-tag-names': [
        level,
        {
          definedTags: ['NOTE:', 'jest-environment'],
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
      'no-process-env': level,
      'no-restricted-globals': ['error'].concat(restrictedGlobals),
      'no-restricted-imports': [
        'error', {
            patterns: [
              {
                group: ['../*'],
                message: 'Usage of relative imports is not allowed. Use path aliases.',
              },
              {
                group: ['*'],
                importNames: ['*'],
                message: 'Wildcard imports are not allowed. Use named imports instead.',
              },
            ],
          },
      ],
      'no-unused-expressions': [level, { allowShortCircuit: true, allowTernary: true }],
      'no-unused-vars': [level, { varsIgnorePattern: '^_', argsIgnorePattern: '^_|^this$' }],
      'no-useless-escape': 'off',
      /** Issue with Prettier https://github.com/prettier/eslint-plugin-prettier/issues/65: */
      'prefer-arrow-callback': 'off',
      'prefer-object-spread': level,
      'prefer-spread': level,
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-unsafe-regex': 'off',
      'semi': ['error', 'never'],
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
      /** This file implements type guards and legitimately needs type assertions */
      'custom-rules/no-html-element-assertions': 'off',
    },
  },
  {
    files: ['**/*error.spec.ts'],
    rules: {
      /** Error test files use mock objects which legitimately need type assertions */
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
      /** Database files that use snake_case for database field names */
      'src/pages/api/gdpr/consent.ts',
      'src/pages/api/gdpr/request-data.ts',
      'src/pages/api/gdpr/verify.ts',
      'src/pages/api/newsletter/_token.ts',
    ],
    rules: {
      camelcase: 'off',
    },
  },
  {
    /** Test files can import from server code in src/lib, but must use server-side helpers */
    files: ['src/**/__tests__/**/*'],
    rules: {
      'import/no-restricted-paths': [
        level,
        {
          zones: [
            {
              target: 'src/**/__tests__/**/*',
              from: 'src/components/scripts/utils/environmentClient.ts',
              message: 'use src/lib/config/environmentServer.ts in test files, not environmentClient.',
            },
            {
              target: 'src/**/__tests__/**/*',
              from: 'src/components/scripts/utils/siteUrlClient.ts',
              message: 'use src/lib/config/siteUrlServer.ts in test files, not siteUrlClient.',
            },
          ],
        },
      ],
    },
  },
  /** Environment file in src/pages/api is an except to the restricted paths rule */
  {
    files: [
      'src/pages/api/_environment/environmentApi.ts',
      'src/pages/api/_logger/index.ts',
    ],
    rules: {
      'import/no-restricted-paths': 'off',
    },
  },
  {
    /** These directories can use process.env, which is forbidden in other files */
    files: [
      '.eslintrc.js',
      'astro.config.ts',
      'playwright.config.ts',
      'vitest.setup.ts',
      'src/components/scripts/utils/environmentClient.ts',
      'src/lib/config/**/*',
      'src/pages/api/_environment/**/*',
    ],
    rules: {
      'no-process-env': 'off',
    },
  },
  {
    /**
     * Path aliases cannot be used in files that are imported by astro.config.ts.
     */
    files: [
      'src/integrations/**/*',
      'src/lib/config/**/*',
    ],
    rules: {
      'no-restricted-imports': [
        'error', {
            patterns: [
              {
                group: ['@/*'],
                message: 'Path aliases cannot be used in files that are imported by astro.config.ts. See notes in that config file for the reasons why.',
              },
            ],
          },
      ],
    },
  },
  {
    files: [
      'src/components/**/*',
      'src/layouts/**/*',
      'src/pages/**/*',
    ],
    rules: {
      'no-restricted-imports': [
        'error', {
            patterns: [
              {
                group: ['astro:env/server'],
                message: 'Client code must use astro:env/client, not astro:env/server.',
              },
            ],
          },
      ],
    },
  },
  {
    files: [
      'src/lib/**/*.ts',
      'src/pages/api/**/*',
    ],
    rules: {
      'no-restricted-imports': [
        'error', {
            patterns: [
              {
                group: ['astro:env/client'],
                message: 'SSR API routes and server code must use astro:env/server, not astro:env/client.',
              },
            ],
          },
      ],
    },
  },
  {
    /** No import.meta.env use in general. */
    files: [
      'src/components/**/*',
      'src/layouts/**/*',
      'src/pages/**/*',
    ],
    rules: {
      'no-restricted-syntax': [
        level,
        {
          'selector': 'MetaProperty[meta.name="import"][property.name="meta"]',
          'message': 'Do not use import.meta.env directly. See docs/ENVIRONMENT_VARIABLES.'
        }
      ],
    },
  },
  {
    /** These files can use import.meta.env */
    files: [
      'src/components/scripts/utils/environmentClient.ts',
      'src/components/scripts/utils/siteUrlClient.ts',
      'src/lib/config/environmentServer.ts',
      'src/lib/config/siteUrlServer.ts',
      'src/pages/api/_environment/index.ts',
      'src/pages/api/_environment/environmentApi.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'off',
        {
          'selector': 'MetaProperty[meta.name="import"][property.name="meta"]',
        }
      ],
    },
  },
]
