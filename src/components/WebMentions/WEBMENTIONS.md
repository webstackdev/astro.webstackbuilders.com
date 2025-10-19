# WebMentions Component

Modern Astro implementation of webmentions for displaying social interactions from across the web.

## Overview

WebMentions is an open web standard for conversations and interactions across different websites. This component integrates with [webmention.io](https://webmention.io/) and [Bridgy](https://brid.gy/) to display:

- Mentions and replies from other websites
- Likes and reposts from social media (via Bridgy)
- Comments and interactions
- Author facepiles

## Setup

### 1. Sign up for webmention.io

1. Visit [https://webmention.io/](https://webmention.io/)
2. Sign in using your domain (requires `rel="me"` link to GitHub/Twitter)
3. Get your API token from [settings](https://webmention.io/settings)

### 2. Add rel="me" Links

Add these links to your site's footer or header:

```html
<a href="https://github.com/yourusername" rel="me">GitHub</a>
<a href="https://twitter.com/yourusername" rel="me">Twitter</a>
```

### 3. Set Environment Variable

Add to your `.env` file:

```bash
WEBMENTION_IO_TOKEN=your_token_here
```

For production (Vercel/Netlify), add this as an environment variable in your hosting dashboard.

### 4. Set up Bridgy (Optional)

To pull in social media interactions:

1. Visit [https://brid.gy/](https://brid.gy/)
2. Sign in with your social accounts
3. Connect your website
4. Bridgy will automatically send webmentions from social media to webmention.io

### 5. Add Webmention Endpoint

Add to your site's `<head>`:

```html
<link rel="webmention" href="https://webmention.io/webstackbuilders.com/webmention" />
<link rel="pingback" href="https://webmention.io/webstackbuilders.com/xmlrpc" />
```

## Usage

### Basic Usage

```astro
---
import { WebMentions } from '@components/WebMentions'

const currentUrl = `https://webstackbuilders.com${Astro.url.pathname}`
---

<WebMentions url={currentUrl} />
```

### In Article/Case Study Pages

Add to your content pages:

```astro
---
// In /src/pages/articles/[...slug].astro
import { WebMentions } from '@components/WebMentions'

const path = `/articles/${article.id}/`
const fullUrl = `https://webstackbuilders.com${path}`
---

<MarkdownLayout {...props}>
  <div set:html={content} />

  <!-- Add WebMentions after content -->
  <div slot="after-content">
    <WebMentions url={fullUrl} />
  </div>
</MarkdownLayout>
```

### Advanced Usage

```astro
<WebMentions
  url={fullUrl}
  showFacepile={true}
  facepileLimit={10}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `url` | `string` | Required | The absolute URL to fetch webmentions for |
| `showFacepile` | `boolean` | `true` | Show avatar facepile of recent mentions |
| `facepileLimit` | `number` | `5` | Maximum number of avatars to show |

## Features

### Conditional Rendering

The component only renders when webmentions exist for the URL. No empty sections.

### Interaction Types

- **Mentions & Replies**: Full content display with author info
- **Likes**: Counted and displayed with heart icon
- **Reposts**: Counted and displayed with repost icon

### Security

- Basic HTML sanitization (removes scripts and iframes)
- For production, consider adding [sanitize-html](https://www.npmjs.com/package/sanitize-html) or [DOMPurify](https://www.npmjs.com/package/dompurify)

### Performance

- Fetches during build time (SSG)
- 5-minute cache during build
- No client-side fetching
- Lazy loading of images

## Styling

The component uses CSS custom properties for theming:

```css
--color-theme-text
--color-theme-text-offset
--color-theme-text-lighter
--color-theme-bg
--color-theme-bg-offset
--color-theme-border
--color-theme-link
--color-theme-link-hover
```

Override styles by targeting these classes:

- `.webmentions` - Main container
- `.webmentions__facepile` - Avatar grid
- `.webmentions__list` - Mentions list
- `.webmention` - Individual mention item

## File Structure

```text
WebMentions/
├── README.md                 # This file
├── WebMentions.astro         # Main component
├── WebMentionItem.astro      # Individual mention display
├── webmentions.ts            # Fetch & processing utilities
└── index.ts                  # Module exports
```

## API Reference

### `fetchWebmentions(url, token?)`

Fetch webmentions for a URL from webmention.io.

```typescript
const mentions = await fetchWebmentions('https://example.com/article/')
```

### `webmentionsByUrl(mentions, url)`

Filter webmentions array by target URL.

```typescript
const filtered = webmentionsByUrl(allMentions, targetUrl)
```

### `webmentionCountByType(mentions, url, ...types)`

Count webmentions of specific types.

```typescript
const likes = webmentionCountByType(mentions, url, 'like-of')
const interactions = webmentionCountByType(mentions, url, 'like-of', 'repost-of')
```

### `isOwnWebmention(mention, ownUrls?)`

Check if a mention is from your own domain.

```typescript
if (isOwnWebmention(mention, ['https://webstackbuilders.com'])) {
  // Handle self-mention
}
```

## Testing

Test webmentions locally:

1. Use [webmention.rocks](https://webmention.rocks/) test suite
2. Send test mentions using [Telegraph](https://telegraph.p3k.io/)
3. Check your [webmention.io dashboard](https://webmention.io/dashboard)

## Troubleshooting

### No mentions appearing

- Check API token is set correctly
- Verify URL matches exactly (including trailing slash)
- Check webmention.io dashboard for received mentions
- Ensure `rel="webmention"` link is in your HTML

### Likes/Reposts not showing

- Set up Bridgy for your social accounts
- Verify Bridgy is successfully polling
- Check Bridgy dashboard for errors

### Build errors

- Ensure `WEBMENTION_IO_TOKEN` is set (warnings only if missing)
- Check network access during build (some CI environments restrict external calls)

## Resources

- [Webmention.io Documentation](https://webmention.io/)
- [Bridgy Documentation](https://brid.gy/)
- [IndieWeb Webmention](https://indieweb.org/Webmention)
- [Webmention Spec](https://www.w3.org/TR/webmention/)

## Migration from Eleventy

This component replaces the Eleventy plugin with:

- ✅ Native Astro component (no plugin needed)
- ✅ TypeScript support
- ✅ Build-time fetching (SSG)
- ✅ Modern styling with CSS custom properties
- ✅ Conditional rendering
- ✅ Better security defaults

The old Eleventy files in this directory can be safely deleted once migration is complete.
