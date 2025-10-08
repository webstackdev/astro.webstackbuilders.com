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

## Cookie Customize page

Next Steps Available:

- Analytics Integration: Connect the analytics toggle to your actual Google Analytics or other tracking services
- Advanced Features: Add cookie expiration management, preference export/import
- Compliance: Add GDPR compliance features like data deletion requests
- Testing: Verify the cookie preferences work correctly across different browsers

Future Cleaner Import (using barrel file):
import { initializeCookiePreferences, CookiePreferencesManager } from '@lib/cookies'

17:16:51 [WARN] [vite]
../fonts/OnestRegular1602-hint.woff2 referenced in ../fonts/OnestRegular1602-hint.woff2 didn't resolve at build time, it will remain unchanged to be resolved at runtime
17:16:51 [WARN] [vite]
../fonts/Lora-Regular.woff2 referenced in ../fonts/Lora-Regular.woff2 didn't resolve at build time, it will remain unchanged to be resolved at runtime
17:16:51 [WARN] [vite]
../fonts/IBMPlexMono-Regular.woff2 referenced in ../fonts/IBMPlexMono-Regular.woff2 didn't resolve at build time, it will remain unchanged to be resolved at runtime
17:16:51 [WARN] [vite] [esbuild css minify]
▲ [WARNING] Expected ";" but found "}" [css-syntax-error]

    <stdin>:1:33808:
      1 │ ...er utilities{@tailwind utilities}@source "../src *.{astro,ts,tsx...
        │                                    ^
        ╵                                    ;
