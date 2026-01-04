import linkValidator from 'astro-link-validator'

export const linkValidatorPlugin = linkValidator({
  checkExternal: true,
  exclude: [
    /**
     * Company social network links are manually maintained, rated
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
    /** Requires HEAD request, not GET */
    'https://outlook.office.com/calendar/0/deeplink/compose',
    /** Rate-limited URLs that will always fail */
    'https://www.npmjs.com',
    /** Dummy link in demo page */
    '/path/to#my-blob',
  ],
  failOnBrokenLinks: true,
  verbose: true,
})