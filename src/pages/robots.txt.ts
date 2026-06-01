import type { APIRoute } from 'astro'

const getRobotsTxt = (sitemapURL: URL) => `\
User-agent: *
Allow: /
Disallow: /downloads/
Disallow: /offline
Disallow: /print
Disallow: /search
Disallow: /tags
Disallow: /testing

Sitemap: ${sitemapURL.href}
`

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site)
  return new Response(getRobotsTxt(sitemapURL))
}
