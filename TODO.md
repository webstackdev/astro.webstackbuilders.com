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
- astro-svg-sprite, /home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/scripts/build/tasks/build:sprites.ts

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
