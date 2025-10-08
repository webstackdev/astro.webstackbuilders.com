# TODO

- Test the remaining gulp tasks to ensure they work properly?
- Look into the TailwindCSS TypeScript error?
- Move on to updating and running the test cases?
- Make the MDX plugins commented out in astro.config.mjs work
- update the package.json scripts files to whatever we actually use
- are we validating front matter?
- src/components/Script/visibility.ts - Only mentioned in TODO comment
- src/components/Script/share-highlight.ts - Only referenced in commented-out import
- src/components/Script/Script/animations/ directory (all files) - Only referenced in commented-out import
- src/components/Footer/index.ts - footerInit() function for dynamic "Hire Me" text
- We deleted some of the social media logic. I think it was designed to create a social media card when an article is shared on x or whatever.
- Are all of the dependencies in package.json being used, after script is all cleaned up

## Cookie Customize page

Next Steps Available:

- Analytics Integration: Connect the analytics toggle to your actual Google Analytics or other tracking services
- Advanced Features: Add cookie expiration management, preference export/import
- Compliance: Add GDPR compliance features like data deletion requests
- Testing: Verify the cookie preferences work correctly across different browsers

Future Cleaner Import (using barrel file):
import { initializeCookiePreferences, CookiePreferencesManager } from '@lib/cookies'

17:16:51 [WARN] [vite] [esbuild css minify]
▲ [WARNING] Expected ";" but found "}" [css-syntax-error]

    <stdin>:1:33808:
      1 │ ...er utilities{@tailwind utilities}@source "../src *.{astro,ts,tsx...
        │                                    ^
        ╵                                    ;
18:30:13 [WARN] [vite] Generated an empty chunk: "Signup.astro_astro_type_script_index_0_lang".

Deprecation Warning [import]: Sass @import rules are deprecated and will be removed in Dart Sass 3.0.0.

More info and automated migrator: https://sass-lang.com/d/import

   ╷
14 │ @import "tailwindcss";
   │         ^^^^^^^^^^^^^
   ╵
    src/styles/global.scss 14:9  root stylesheet

```bash
├─┬ @vite-pwa/astro@1.1.0
│ ├── UNMET OPTIONAL DEPENDENCY @vite-pwa/assets-generator@^1.0.0

├─┬ eslint@9.37.0
│ ├── UNMET OPTIONAL DEPENDENCY jiti@*

├─┬ gulp-stylelint@13.0.0
│ ├── stylelint@16.25.0 deduped invalid: "^13.0.0" from node_modules/gulp-stylelint

├─┬ jsdom@27.0.0
│ ├── UNMET OPTIONAL DEPENDENCY canvas@^3.0.0

├─┬ postcss-load-config@6.0.1
│ ├── UNMET OPTIONAL DEPENDENCY jiti@>=1.21.0
│ ├── UNMET OPTIONAL DEPENDENCY tsx@^4.8.1

├─┬ resend@6.1.2
│ └── UNMET OPTIONAL DEPENDENCY @react-email/render@*

├─┬ stylelint-config-html@1.1.0
│ └── stylelint@16.25.0 deduped invalid: "^13.0.0" from node_modules/gulp-stylelint

├─┬ stylelint-config-standard-scss@16.0.0
│ └── stylelint@16.25.0 deduped invalid: "^13.0.0" from node_modules/gulp-stylelint

├─┬ stylelint-declaration-block-no-ignored-properties@2.8.0
│ └── stylelint@16.25.0 deduped invalid: "^13.0.0" from node_modules/gulp-stylelint

├─┬ stylelint-order@7.0.0
│ └── stylelint@16.25.0 deduped invalid: "^13.0.0" from node_modules/gulp-stylelint

├─┬ stylelint-scss@6.12.1
│ └── stylelint@16.25.0 deduped invalid: "^13.0.0" from node_modules/gulp-stylelint

├─┬ stylelint@16.25.0 invalid: "^13.0.0" from node_modules/gulp-stylelint

├─┬ ts-node@10.9.2
│ ├── UNMET OPTIONAL DEPENDENCY @swc/core@>=1.2.50
│ ├── UNMET OPTIONAL DEPENDENCY @swc/wasm@>=1.2.50

├─┬ vite@7.1.9
│ ├── UNMET OPTIONAL DEPENDENCY jiti@>=1.21.0
│ ├── UNMET OPTIONAL DEPENDENCY less@^4.0.0
│ ├── UNMET OPTIONAL DEPENDENCY lightningcss@^1.21.0
│ ├── UNMET OPTIONAL DEPENDENCY sass-embedded@^1.70.0
│ ├── UNMET OPTIONAL DEPENDENCY stylus@>=0.54.8
│ ├── UNMET OPTIONAL DEPENDENCY sugarss@^5.0.0
│ ├── UNMET OPTIONAL DEPENDENCY tsx@^4.8.1

├─┬ vitest@3.2.4
│ ├── UNMET OPTIONAL DEPENDENCY @edge-runtime/vm@*
│ ├── UNMET OPTIONAL DEPENDENCY @vitest/browser@3.2.4
│ ├── UNMET OPTIONAL DEPENDENCY @vitest/ui@3.2.4
│ ├── UNMET OPTIONAL DEPENDENCY happy-dom@*
```
