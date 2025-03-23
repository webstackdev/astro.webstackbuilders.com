declare module 'critical' {
  interface criticalConfig {
    /**
     * List of directories/urls where the inliner should start looking for assets
     *
     * @default []
     */
    assetPaths?: string[] | null[]

    /**
     * An array of paths to css files, file globs or Vinyl file objects.
     *
     * @default []
     */
    css?: string[] | null[]

    /**
     * Base directory in which the source and destination are to be written.
     *
     * @default path.dirname(src) || process.cwd()
     */
    base?: string

    /**
     * String with HTML source to analyze. Takes precedence over the `src` option.
     */
    html?: string

    /**
     * Inline the generated critical-path CSS using filamentgroup's loadCSS.
     * Boolean `true` generates HTML, `false` generates CSS. Pass an object
     * to configure inline-critical.
     *
     * @default false
     */
    inline?: boolean

    /**
     * Critical tries it's best to rebase the asset paths relative to the
     * document. If this doesn't work as expected you can always use this
     * option to control the rebase paths. See postcss-url for details:
     * https://github.com/pocketjoso/penthouse#usage-1.
     *
     * @default undefined
     */
    rebase?: any // can be a function or object

    /**
     * Location of where to save the output. Use an object
     * with `html` and `css` props if you want to store both.
     */
    target?:
      | string
      | {
          css: string
          html: string
          uncritical: string
        }

    /**
     * Remove the inlined styles from any stylesheets referenced in the HTML.
     * It generates new references based on extracted content so it's safe to
     * use for multiple HTML files referencing the same stylesheet. Use with
     * caution. Removing the critical CSS per page results in a unique async
     * loaded CSS file for every page. Meaning you can't rely on cache across
     * multiple pages
     *
     * @default false
     */
    extract?: boolean

    /**
     * CSS rules to ignore.
     *
     * @default undefined
     */
    ignore?: {
      //atrule: ['@font-face'],
      //rule: [/some-regexp/],
      //decl: (node, value) => /big-image\.png/.test(value),
      [key: string]: string[] | RegExp[] | ((node: any, value: string) => string)
    }

    /**
     * Inline images
     *
     * @default false
     */
    inlineImages?: boolean

    /**
     * Sets a max file size (in bytes) for base64 inlined images
     *
     * @default 10240
     */
    maxImageFileSize?: number

    /**
     * Viewport height
     */
    height?: number

    /**
     * Viewport width
     */
    width?: number

    /**
     * An array of objects containing height and width. Takes precedence
     * over width and height if set.
     *
     * @default []
     */
    dimensions?: { height: number; width: number }[]

    /**
     * Configuration options for Penthouse critical path css generator.
     * Many Critical options are passed directly to Penthouse. Has `forceInclude`
     * option, an array of css selectors to keep in critical css, even
     * if not appearing in critical viewport. Strings or regex. Useful
     * for HTML that varies based on things such as the logged in user
     * or third party advertising.
     * https://github.com/pocketjoso/penthouse
     *
     * @default {}
     */
    penthouse?: { [key: string]: any }
  }

  export function stream(params: criticalConfig): NodeJS.ReadWriteStream
}
