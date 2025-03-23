import { defineConfig, envField } from 'astro/config'
import mdx from '@astrojs/mdx'
import preact from "@astrojs/preact"
import prefetch from "@astrojs/prefetch"
import purgecss from "astro-purgecss"
//import svgSprite from "astro-svg-sprite"
import tailwind from '@astrojs/tailwind'
// import remarkToc from 'remark-toc'
// import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'

export default defineConfig({
  /** Available at import.meta.env.SITE */
  site: 'https://webstackbuilders.com',
  integrations: [
    mdx(/*{
      syntaxHighlight: 'shiki', // 'prism'
      shikiConfig: { theme: 'dracula' },
      remarkPlugins: [ [remarkToc, { heading: "contents"} ] ],
      rehypePlugins: [rehypeAccessibleEmojis],
      remarkRehype: { footnoteLabel: 'Footnotes', footnoteBackLabel: "Back to reference 1" },
      gfm: false, // default is true
    }*/),
    preact(),
    prefetch(), // Prefetch page links when the link becomes visible on screen
    /*
    // Could use astro-svg-sprite instead of Gulp with svg-sprite
    svgSprite({
      include: ['./src/assets/images/sprites'],
    }),
    */
    tailwind({
      // don't autogenerate base style sheet and inject it, and use project
      // base.css that has @tailwind base, components, and utilities directives
      applyBaseStyles: false,
    }),
    purgecss(), // PurgeCSS should be last item in integrations array
  ],
  // Usage:
  // import { SERVER_API_URL } from "astro:env/server";
  // <script>import { API_URL } from "astro:env/client";</script>
  env: {
    // Data types supported are strings, numbers, enums, and booleans.
    /*
    envField.enum({
      // context & access
      values: ['foo', 'bar', 'baz'],
      optional: true,
      default: 'baz',
    })
    */
    schema: {
      // Public client variables end up in both the final client and server bundles, and can be accessed from both client and server through the astro:env/client module.
      //API_URL: envField.string({ context: "client", access: "public", optional: true }),
      // Public server variables end up in the final server bundle.
      //PORT: envField.number({ context: "server", access: "public", default: 4321 }),
      // Secret server variables are not part of the final server bundle and are only validated at runtime.
      //API_SECRET: envField.string({ context: "server", access: "secret" }),
    }
  },
})
