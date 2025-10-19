/**
 * WebMentions module
 * Export components and utilities for webmention integration
 */
export { default as WebMentions } from './WebMentions.astro'
export {
  fetchWebmentions,
  webmentionsByUrl,
  webmentionCountByType,
  isOwnWebmention,
  type Webmention,
  type WebmentionAuthor,
  type WebmentionContent
} from './server'
