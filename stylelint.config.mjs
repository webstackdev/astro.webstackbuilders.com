import standardConfig from 'stylelint-config-standard'

/** @type {import('stylelint').Config} */
export default {
  ...standardConfig,
  overrides: [
    {
      files: ['**/*.astro'],
      customSyntax: 'postcss-html',
    },
    {
      files: ['src/components/**/*.module.css'],
      rules: {
        /** Prefer component-scoped classes; avoid IDs in component styles. */
        'selector-max-id': 0,
      },
    },
    {
      files: ['src/styles/print.css', 'src/styles/vendor/**/*.css', 'src/components/Forms/Contact/uppy-dashboard.css'],
      rules: {
        /** Allow vendor/print CSS to use !important when necessary. */
        'declaration-no-important': null,
      },
    },
  ],
  plugins: [
    'stylelint-declaration-block-no-ignored-properties',
    'stylelint-order',
  ],
  rules: {
    ...standardConfig.rules,

    /** Prefer solving conflicts via layering/specificity, not !important. */
    'declaration-no-important': true,

    // Value notation
    'alpha-value-notation': [
      'percentage',
      {
        exceptProperties: ['opacity'],
      },
    ],
    'color-function-notation': 'modern',
    'color-hex-length': 'short',
    'font-weight-notation': 'named-where-possible',
    'hue-degree-notation': 'angle',

    // Disallowed/required patterns
    'at-rule-disallowed-list': ['extend'],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'at-root',
          'content',
          'each',
          'else',
          'error',
          'extends',
          'for',
          'forward',
          'function',
          'include',
          'if',
          'mixin',
          'plugin',
          'return',
          'source',
          'tailwind',
          'theme',
          'use',
          'warn',
        ],
      },
    ],
    'at-rule-no-vendor-prefix': true,
    'import-notation': null,

    // Empty lines
    'at-rule-empty-line-before': [
      'always',
      {
        except: ['blockless-after-same-name-blockless', 'first-nested'],
        ignore: ['after-comment'],
        ignoreAtRules: ['else'],
      },
    ],
    'comment-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['stylelint-commands'],
      },
    ],
    'custom-property-empty-line-before': [
      'always',
      {
        except: ['after-custom-property', 'first-nested'],
        ignore: ['after-comment', 'inside-single-line-block'],
      },
    ],
    'declaration-empty-line-before': [
      'always',
      {
        except: ['after-declaration', 'first-nested'],
        ignore: ['after-comment'],
      },
    ],
    'rule-empty-line-before': [
      'always-multi-line',
      {
        except: ['first-nested'],
        ignore: ['after-comment'],
      },
    ],

    // Validation rules
    'block-no-empty': true,
    'color-no-invalid-hex': true,
    'comment-no-empty': true,
    'custom-property-no-missing-var-function': true,
    'declaration-block-no-duplicate-custom-properties': true,
    'declaration-block-no-duplicate-properties': [
      true,
      {
        ignore: ['consecutive-duplicates-with-different-values'],
      },
    ],
    'declaration-block-no-shorthand-property-overrides': true,
    'declaration-block-no-redundant-longhand-properties': true,
    'font-family-no-duplicate-names': true,
    'font-family-no-missing-generic-family-keyword': true,
    'function-calc-no-unspaced-operator': true,
    'function-linear-gradient-no-nonstandard-direction': true,
    'keyframe-block-no-duplicate-selectors': true,
    'keyframe-declaration-no-important': true,
    'media-feature-name-no-unknown': true,
    'named-grid-areas-no-invalid': true,
    'no-descending-specificity': true,
    'no-duplicate-at-import-rules': true,
    'no-duplicate-selectors': true,
    'no-invalid-double-slash-comments': true,
    'no-invalid-position-at-import-rule': true,
    'no-irregular-whitespace': true,
    'property-no-unknown': true,
    'property-no-vendor-prefix': true,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],
    'selector-pseudo-element-no-unknown': true,
    'selector-type-no-unknown': [
      true,
      {
        ignore: ['custom-elements'],
      },
    ],
    'unit-no-unknown': true,
    'value-no-vendor-prefix': true,

    // Limits
    'declaration-block-single-line-max-declarations': 1,
    'number-max-precision': 4,
    'selector-max-attribute': 2,
    'selector-max-class': 4,
    'selector-max-combinators': 4,
    'selector-max-compound-selectors': 4,
    'selector-max-id': 1,
    'selector-max-pseudo-class': 3,
    'selector-max-specificity': '1,5,2',
    'selector-max-type': 2,
    'selector-max-universal': 1,
    'time-min-milliseconds': 100,

    // Quotes
    'font-family-name-quotes': 'always-where-recommended',
    'function-url-quotes': 'always',
    'selector-attribute-quotes': 'always',

    // Patterns (kebab-case)
    'custom-media-pattern': null,
    'custom-property-pattern': null,
    'keyframes-name-pattern': null,
    'selector-class-pattern': null,
    'selector-id-pattern': null,

    // Allowed/disallowed units
    'declaration-property-unit-allowed-list': {
      'font-size': ['rem', 'em'],
    },

    // Comments
    'comment-word-disallowed-list': [
      ['/^TODO:/', '/^FIXME:/'],
      {
        severity: 'warning',
      },
    ],

    // Specificity
    'selector-no-qualifying-type': [
      true,
      {
        ignore: ['attribute', 'class'],
      },
    ],

    // Vendor prefixes
    'media-feature-name-no-vendor-prefix': true,
    'selector-no-vendor-prefix': true,

    // Plugin rules
    'order/properties-alphabetical-order': true,
    'plugin/declaration-block-no-ignored-properties': true,
  },
}
