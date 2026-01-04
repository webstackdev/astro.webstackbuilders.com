import linkValidator from 'astro-link-validator'

export const linkValidatorPlugin = linkValidator({
  checkExternal: true,
  exclude: [
    /**
     * Company social network links are manually maintained, rate
     * limited in CI so hard to check automatically
     */
    'https://bsky.app/profile/webstackdev.bsky.social',
    'https://codepen.io/webstackdev',
    'https://github.com/webstackdev',
    'https://k8s.social/@webstackdev',
    'https://webmention.io/www.webstackbuilders.com',
    'https://www.facebook.com/webstackbuilders',
    'https://www.instagram.com/webstackbuilders/',
    'https://www.linkedin.com/company/webstack-builders',
    'https://www.youtube.com/@webstackbuilders',
    'https://x.com/WebstackDev',
    /** Requires HEAD request, not GET. Used in Add-to-Calendar component. */
    'https://outlook.office.com/calendar/0/deeplink/compose',
    /** Rate-limited URLs that will always fail */
    'https://www.npmjs.com',
    /** Dummy link in demo page */
    '/path/to#my-blob',
    /** Skip any links in testing-only pages */
    'https://www.webstackbuilders.com/testing/*',
    /** Skip hard-coded site URLs due to timeouts from CI to Vercel */
    'https://www.webstackbuilders.com',
    'https://www.webstackbuilders.com/rss.xml',
  ],
  externalTimeout: 15000,
  failOnBrokenLinks: true,
  verbose: true,
})