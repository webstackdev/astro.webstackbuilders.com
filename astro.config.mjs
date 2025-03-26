import { defineConfig/*, envField*/ } from 'astro/config'
import mdx from '@astrojs/mdx'
import preact from "@astrojs/preact"
// import svgSprite from "astro-svg-sprite"
// import remarkToc from 'remark-toc'
// import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'

export default defineConfig({
  /** Site name accessible using import.meta.env.SITE */
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
    /*
    // Could use astro-svg-sprite instead of Gulp with svg-sprite
    svgSprite({
      include: ['./src/assets/images/sprites'],
    }),
    */
  ],
  /**
   * Env var usage:
   *
   *   import { SERVER_API_URL } from "astro:env/server";
   *   <script>import { API_URL } from "astro:env/client";</script>
   *
   * Data types supported are strings, numbers, enums, and booleans.
   */
  env: {
    /*
    envField.enum({
      // context & access
      values: ['foo', 'bar', 'baz'],
      optional: true,
      default: 'baz',
    })
    */
    schema: {
      /**
       * Public client variables end up in both the final client and server bundles, and can be accessed
       * from both client and server through the astro:env/client module.
       *
       * Public server variables end up in the final server bundle:
       *   API_URL: envField.string({ context: "client", access: "public", optional: true }),
       *   PORT: envField.number({ context: "server", access: "public", default: 4321 }),
       *
       * Secret server variables are not part of the final server bundle and are only validated at runtime:
       *
       *   API_SECRET: envField.string({ context: "server", access: "secret" }),
       */
    }
  },
  prefetch: true,
})
