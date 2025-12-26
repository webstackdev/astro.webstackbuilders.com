# WebMentions Quick Start Guide

## 5-Minute Setup

### Step 1: Get Your API Token

1. Visit [webmention.io](https://webmention.io/)
2. Sign in (requires `rel="me"` link - see step 2)
3. Copy your API token from the [settings page](https://webmention.io/settings)

### Step 2: Add rel="me" Links

Add to your site's footer (or author bio):

```html
<a href="https://github.com/your-username" rel="me">GitHub</a>
```

### Step 3: Set Environment Variable

Create or update `.env` in your project root:

```bash
WEBMENTION_IO_TOKEN=your_api_token_here
```

**Important**: Also add this to your hosting environment variables (Vercel, Netlify, etc.)

### Step 4: Add Webmention Endpoints

Add to `src/layouts/BaseLayout.astro` in the `<head>`:

```html
<link rel="webmention" href="https://webmention.io/www.webstackbuilders.com/webmention" />
<link rel="pingback" href="https://webmention.io/www.webstackbuilders.com/xmlrpc" />
```

### Step 5: Use the Component

In your article/case-study/service pages:

```astro
---
import { WebMentions } from '@components/WebMentions'

const fullUrl = `https://www.webstackbuilders.com${Astro.url.pathname}`
---

<WebMentions url={fullUrl} />
```

### Example: Articles Page

Edit `/src/pages/articles/[...slug].astro`:

```astro
---
import { WebMentions } from '@components/WebMentions'

const path = `/articles/${article.id}/`
const fullUrl = `https://www.webstackbuilders.com${path}`
---

<MarkdownLayout {...props}>
  <div set:html={content} />

  <div slot="after-content">
    <WebMentions url={fullUrl} />
  </div>
</MarkdownLayout>
```

## Optional: Bridgy Setup

Get social media likes/reposts as webmentions:

1. Visit [brid.gy](https://brid.gy/)
2. Connect your Twitter/Mastodon/etc accounts
3. Done! Bridgy auto-sends webmentions

## Testing

Send yourself a test webmention:

1. Use [Telegraph](https://telegraph.p3k.io/)
2. Enter your article URL
3. Check your [webmention.io dashboard](https://webmention.io/dashboard)
4. Rebuild your site

## Troubleshooting

**No webmentions showing up?**

- Check API token is set in environment
- Verify URL matches exactly (with/without trailing slash)
- Check webmention.io dashboard - are mentions being received?
- Rebuild your site after receiving mentions

**Can't sign in to webmention.io?**

- Make sure you have a `rel="me"` link to GitHub/Twitter
- Link must be visible on your homepage

**Build errors?**

- Missing `WEBMENTION_IO_TOKEN` only shows a warning
- Component gracefully degrades if token is missing
- Check you have network access during build

## What Gets Displayed?

The component shows:

- ✅ Mentions and replies (full content)
- ✅ Like count with icon
- ✅ Repost count with icon
- ✅ Facepile of recent mentioners
- ❌ Nothing if no webmentions exist (conditional)

## Complete Documentation

For full details, see `WEBMENTIONS.md` in this directory.
