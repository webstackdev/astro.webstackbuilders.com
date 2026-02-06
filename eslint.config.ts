/* eslint-disable */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Linter } from 'eslint'
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

const level: Linter.StringSeverity = 'error'
const astroParser = (astroPlugin as unknown as { parser: Linter.Parser }).parser
const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url))

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
          extensions: ['.ts', '.tsx', '.astro', '.d.ts', '.js', '.mjs', '.cjs'],
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
      'custom-rules/no-query-selector-outside-selectors': 'off',
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
            '^virtual:pwa-register$',
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
      'jsdoc/check-line-alignment': 'off',
      'jsdoc/check-param-names': 'off',
      'jsdoc/check-values': 'off',
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
      'no-empty-pattern': [level, { "allowObjectPatternsAsParameters": true }],
      'no-new': level,
      'no-restricted-globals': ['error'].concat(restrictedGlobals),
      'no-restricted-imports': [
        'error', {
            patterns: [
              {
                group: ['*'],
                importNames: ['*'],
                message: 'Wildcard imports are not allowed. Use named imports instead with object destructuring.',
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

  /**
   * =================================================================================================
   *
   * Enforce centralized DOM querying in client-side component code.
   * querySelector/querySelectorAll are only allowed in `selectors.ts` or `*.spec.ts`.
   *
   * =================================================================================================
   */

  {
    files: [
      'src/components/**/*.{ts,astro}',
      'src/components/scripts/**/*.{ts,astro}',
    ],
    rules: {
      'custom-rules/no-query-selector-outside-selectors': [
        level,
        {
          allowedFiles: [
            'src/components/Head/ThemeInit.astro',
            'src/components/Copy/client/utils.ts',
            'src/components/scripts/store/themes.ts',
          ],
        },
      ],
    },
  },

  /**
   * =================================================================================================
   *
   *  Restrict error instantiation to the correct directories. Restricts usage of the built-in
   *  Error class to custom error classes only. Makes sure custom error classes are used in
   *  appropriate contexts - BuildError, ClientScriptError, TestError.
   *
   * =================================================================================================
   */

  {
    /** Disable `new Error` calls */
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        level,
        {
          selector: 'NewExpression[callee.name="Error"]',
          message: 'Use project-specific error classes instead of the base Error constructor.',
        },
      ],
    },
  },
  {
    /** BuildError only in server-only or integration contexts */
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    ignores: [
      'src/integrations/**/*',
      'src/**/server/**/*',
      'src/lib/**/*.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        level,
        {
          selector: 'NewExpression[callee.name="BuildError"]',
          message: 'BuildError can only be instantiated in server-only or integration contexts.',
        },
      ],
    },
  },
  {
    /** ClientScriptError only in client directories and the client scripts directory */
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    ignores: [
      'src/**/client/**/*',
      'src/components/scripts/**/*',
    ],
    rules: {
      'no-restricted-syntax': [
        level,
        {
          selector: 'NewExpression[callee.name="ClientScriptError"]',
          message: 'ClientScriptError can only be instantiated within client-side component directories.',
        },
      ],
    },
  },
  {
    /** TestError only in unit or e2e test directories */
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    ignores: [
      'src/**/__tests__/**',
      'test/e2e/specs/**/*',
    ],
    rules: {
      'no-restricted-syntax': [
        level,
        {
          selector: 'NewExpression[callee.name="TestError"]',
          message: 'TestError can only be instantiated in unit or e2e test directories.',
        },
      ],
    },
  },
  {
    /** Directories defining custom errors can use any error class. */
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    ignores: [
      'test/e2e/helpers/pageObjectModels/**/*',
      'test/e2e/specs/**',
    ],
    rules: {
      'no-restricted-syntax': [
        level,
        {
          selector: 'NewExpression[callee.name="EvaluationError"]',
          message: 'EvaluationError can only be instantiated in e2e test directories.',
        },
      ],
    },
  },
  {
    files: [
      'src/lib/errors/**/*',
      'src/components/scripts/errors/**/*',
      'test/errors/**/*',
      'src/pages/api/_errors/ApiFunctionError.ts',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  /**
   * =================================================================================================
   *
   *  Test files need some relaxed rules to allow "any" types and "as" type assertions
   *
   * =================================================================================================
   */

  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },

  /**
   * =================================================================================================
   *
   *  Allow CSS module class access via dot-notation in Astro files. CSS modules expose an index
   *  signature which normally forces bracket notation; this keeps those files readable while
   *  retaining the stricter behavior elsewhere.
   *
   * =================================================================================================
   */

  {
    files: [
      'src/components/**/*.astro',
      'src/pages/**/*.astro',
    ],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsPlugin.parser,
        project: './tsconfig.json',
        tsconfigRootDir,
        extraFileExtensions: ['.astro'],
        programs: undefined,
      },
    },
    rules: {
      '@typescript-eslint/dot-notation': [level, { allowIndexSignaturePropertyAccess: true }],
    },
  },

  /**
   * =================================================================================================
   *
   *  These files implement type guards and legitimately needs type assertions
   *
   * =================================================================================================
   */

  {
    files: [
      '**/*error.spec.ts',
      'src/components/scripts/assertions/elements.ts',
      'test/e2e/assertions/index.ts',
    ],
    rules: {
      'custom-rules/no-html-element-assertions': 'off',
    },
  },

  /**
   * =================================================================================================
   *
   *  Exceptions to the project custom rule that prevents direct use of addEventListener in
   *  favor of centralized utilities
   *
   * =================================================================================================
   */

  {
    files: [
      /** Centralized utilities providing event listener management */
      'src/components/scripts/elementListeners/index.ts',
      /** Needs direct addEventListener for pause/resume/reset lifecycle */
      'src/components/Social/Shares/client.ts',
    ],
    rules: {
      'custom-rules/enforce-centralized-events': 'off',
    },
  },

  /**
   * =================================================================================================
   *
   *  Database files that use snake_case for database field names
   *
   * =================================================================================================
   */

  {
    files: [
      '.github/actions/**/*',
      'src/actions/**/*',
      'src/components/scripts/sentry/__tests__/helpers.spec.ts',
      'src/components/scripts/store/__tests__/socialEmbeds.spec.ts',
      'src/lib/config/pwa.ts',
      'src/lib/config/serviceWorker.ts',
      'src/pages/api/**/*',
      'src/pages/manifest.json.ts',
      'test/e2e/specs/15-cron/cron.spec.ts',
    ],
    rules: {
      camelcase: 'off',
    },
  },

  /**
   * =================================================================================================
   *
   *  No process.env use in general. This is to prevent mis-use in client code
   *  and ensure expected environmental variables are available in code context.
   *
   * =================================================================================================
   */

  {
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    rules: {
      'no-process-env': level,
    },
  },
  {
    /** These directories can use process.env, which is forbidden in other files */
    files: [
      '.eslintrc.js',
      '.github/actions/**/*',
      'astro.config.ts',
      'playwright.config.ts',
      'vitest.config.ts',
      'vitest.setup.ts',
      'src/components/scripts/utils/environmentClient.ts',
      'src/lib/config/**/*',
      'src/pages/api/_utils/environment/**/*',
      'test/e2e/config/runtime/database.ts',
      'test/e2e/config/global-setup.ts',
      'test/e2e/config/runtime/mockState.ts',
      'test/e2e/db/libsqlClient.ts',
      'test/e2e/helpers/pageObjectModels/**/*',
      'test/e2e/helpers/mockServices.ts',
      'test/e2e/specs/05-api/cron.spec.ts',
    ],
    rules: {
      'no-process-env': 'off',
    },
  },

  /**
   * =================================================================================================
   *
   *  No import.meta.env use in general, for the same reason as the restriction on use of
   *  process.env.  This is to prevent mis-use in client code and ensure expected environmental
   *  variables are  available in code context.
   *
   * =================================================================================================
   */

  {
    files: [
      'src/components/**/*',
      'src/layouts/**/*',
      'src/pages/**/*',
    ],
    rules: {
      'no-restricted-syntax': [
        level,
        {
          selector: 'MemberExpression[property.name="env"] > MetaProperty[meta.name="import"][property.name="meta"]',
          message: 'Do not use import.meta.env directly. See docs/ENVIRONMENT_VARIABLES.',
        },
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
      'src/pages/api/_utils/environment/environmentApi.ts',
      'test/e2e/config/global-setup.ts',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  /**
   * =================================================================================================
   *
   *  Enforce use of path aliases in the project over relative imports
   *
   * =================================================================================================
   */

  {
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        level,
        {
          patterns: [
            {
              group: ['../*'],
              message: 'Usage of relative imports is not allowed. Use path aliases.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/integrations/**/*',
      'src/lib/config/**/*',
    ],
    rules: {
      'no-restricted-imports': [
        level, {
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

  /**
   * =================================================================================================
   *
   *  The following rules are designed to enforce separation of client-side, SSR,
   *  and build-time server code so that Vite does not incorrectly bundle code.
   *
   * =================================================================================================
   */

  /**
   * Restrict the server directory in components, layouts, and pages to
   * importing only from src/components/scripts
   */
  {
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    rules: {
      'import/no-restricted-paths': [
        level,
        {
          zones: [
            {
              target: 'src/**/client/**/*',
              from: 'src/lib/**/*',
              message: 'The src/lib directory is for build-time code only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    rules: {
      'import/no-restricted-paths': [
        'off',
        {
          zones: [
            {
              target: 'src/**/server/**/*',
              from: 'src/lib/**/*',
            },
          ],
        },
      ],
    },
  },
  /**
   * Restrict the client directory in components, layouts, and pages to importing only from src/lib
   */
  {
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    rules: {
      'import/no-restricted-paths': [
        level,
        {
          zones: [
            {
              target: 'src/**/server/**/*',
              from: 'src/components/scripts/**/*',
              message: 'The src/components/scripts directory is for client bundle code only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    rules: {
      'import/no-restricted-paths': [
        'off',
        {
          zones: [
            {
              target: 'src/**/client/**/*',
              from: 'src/components/scripts/**/*',
            },
          ],
        },
      ],
    },
  },
  /**
   * Test files can import from server code in src/lib, but must use server-side helpers
   */
  {
    files: [
      'src/**/__tests__/**/*'
    ],
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
  {
    files: [
      /** Test case for the utility is an exception to the restricted paths rule */
      'src/components/scripts/utils/__tests__/siteUrlClient.spec.ts',
      /** Environment file in src/pages/api is an exception to the restricted paths rule */
      'src/pages/api/_environment/environmentApi.ts',
      'src/pages/api/_logger/index.ts',
    ],
    rules: {
      'import/no-restricted-paths': 'off',
    },
  },

  /**
   * =================================================================================================
   *
   *  Control use of "astro:env" helper for environmental variable imports.
   *
   * =================================================================================================
   */

  {
    files: [
      'src/lib/**/*.ts',
      'src/pages/api/**/*',
    ],
    rules: {
      'no-restricted-imports': [
        level, {
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
    files: [
      'src/components/**/*',
      'src/layouts/**/*',
      'src/pages/**/*',
    ],
    rules: {
      'no-restricted-imports': [
        level, {
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

  /**
   * =================================================================================================
   *
   *  Control use of environment helpers based on project area (client, API, build-time, test)
   *
   * =================================================================================================
   */

  {
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    ignores: [
      'src/**/client/**',
      'src/components/scripts/**/*',
      'src/pages/testing/**/*',
    ],
    rules: {
      'no-restricted-imports': [
        level,
        {
          paths: [
            {
              name: '@components/scripts/utils/environmentClient',
              message: 'Server code must not import client-only helpers. Use server-side env utilities instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    ignores: [
      'src/integrations/**/*',
      'src/**/__tests__/**/*',
      'src/**/server/**/*',
      'src/lib/**/*.ts',
      'src/pages/**/*.astro',
      'src/pages/api/_utils/environment/environmentApi.ts',
    ],
    rules: {
      'no-restricted-imports': [
        level,
        {
          paths: [
            {
              name: '@lib/config/environmentServer',
              message: 'Client code must not import server-only helpers. Use client-side env utilities instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.astro',
      '**/*.ts',
      '**/*.tsx',
    ],
    ignores: [
      'src/pages/api/**/*',
    ],
    rules: {
      'no-restricted-imports': [
        level,
        {
          paths: [
            {
              name: '@pages/api/_utils/environment/environmentApi.ts',
              message: 'Non-API code must not import API-only helpers. Use either client-side or server-side env utilities as appropriate instead.',
            },
          ],
        },
      ],
    },
  },
  /**
   * =================================================================================================
   *
   *  Test files using dynamic imports need to include the file extension
   *
   * =================================================================================================
   */
  {
    files: [
      'test/e2e/specs/14-system/package-release.spec.ts',
      'test/e2e/specs/14-system/privacy-policy-version.spec.ts',
    ],
    rules: {
      'import/extensions': 'off',
    },
  },
]
