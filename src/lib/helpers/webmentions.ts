// Note: sanitize-html package would need to be installed
// import sanitizeHTML from 'sanitize-html';

interface Webmention {
  'wm-id': string;
  'wm-target': string;
  'wm-property': string;
  'wm-source'?: string;
  published: string;
  author?: {
    url?: string;
    name?: string;
  };
  content?: {
    html?: string;
    text?: string;
    value?: string;
  };
}

// Mock sanitizeHTML function since the package isn't installed
const sanitizeHTML = (html: string, _options: any): string => {
  // Simple sanitization - in production you'd use the sanitize-html package
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Usage:
 *   <div class="webmention {% if webmention|isOwnWebmention %}webmention--own{% endif %}" id="webmention-{{ webmention['wm-id'] }}">
 *
 * @param _ - Unused parameter
 * @param webmention - The webmention object
 */
export const isOwnWebmention = function (_: any, webmention: Webmention): boolean {
  const urls = ['https://mxb.at', 'https://mxb.dev', 'https://twitter.com/mxbck']
  const authorUrl = webmention.author?.url
  // check if a given URL is part of this site.
  return Boolean(authorUrl && urls.includes(authorUrl))
}

/**
 * Usage:
 *   {%- set mentions = webmentions.children | webmentionsByUrl(webmentionUrl) -%}
 *
 * @param _ - Unused parameter
 * @param webmentions - Array of webmentions
 * @param url - Target URL to filter by
 */
export const webmentionsByUrl = function (_: any, webmentions: Webmention[], url: string): Webmention[] {
  const allowedTypes = ['mention-of', 'in-reply-to']
  const allowedHTML = {
    allowedTags: ['b', 'i', 'em', 'strong', 'a'],
    allowedAttributes: {
      a: ['href'],
    },
  }

  const orderByDate = (a: Webmention, b: Webmention) => new Date(a.published).getTime() - new Date(b.published).getTime()

  const checkRequiredFields = (entry: Webmention) => {
    const { author, published, content } = entry
    return !!author && !!(author as any).name && !!published && !!content
  }

  const clean = (entry: Webmention) => {
    if (!entry.content) return entry;

    const { html, text } = entry.content
    if (html) {
      // really long html mentions, usually newsletters or compilations
      entry.content.value =
        html.length > 2000
          ? `mentioned this in <a href="${entry['wm-source']}">${entry['wm-source']}</a>`
          : sanitizeHTML(html, allowedHTML)
    } else if (text) {
      entry.content.value = sanitizeHTML(text, allowedHTML)
    }
    return entry
  }

  return webmentions
    .filter(entry => entry['wm-target'] === url)
    .filter(entry => allowedTypes.includes(entry['wm-property']))
    .filter(checkRequiredFields)
    .sort(orderByDate)
    .map(clean)
}

/**
 * Usage:
 *   {%- set likeCount = webmentions.children | webmentionCountByType(webmentionUrl, "like-of") -%}
 *
 * @param _ - Unused parameter
 * @param webmentions - Array of webmentions
 * @param url - Target URL to filter by
 * @param types - Types to count
 */
export const webmentionCountByType = function (_: any, webmentions: Webmention[], url: string, ...types: string[]): string {
  const isUrlMatch = (entry: Webmention) =>
    entry['wm-target'] === url || entry['wm-target'] === url.replace('mxb.dev', 'mxb.at')

  return String(
    webmentions.filter(isUrlMatch).filter((entry: Webmention) => types.includes(entry['wm-property'])).length
  )
}
