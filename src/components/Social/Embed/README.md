# Social Embed Component

Multi-platform social media embed component with lazy loading, oEmbed integration, and localStorage caching.

## Features

- **8 Supported Platforms**: X (Twitter), LinkedIn, Bluesky, Mastodon, Reddit, YouTube, GitHub Gist, CodePen
- **Hybrid Platform Detection**: Auto-detection with manual override support
- **Lazy Loading**: Uses Intersection Observer API (500px preload margin)
- **Smart Caching**: localStorage with configurable TTL from oEmbed response
- **Responsive Design**: Theme-aware placeholders and responsive LinkedIn iframes
- **Manager/Instance Pattern**: Efficient resource management with singleton pattern

## Usage

### Auto-Detection (Most Platforms)

```mdx
<Embed url="https://twitter.com/user/status/123456789" />
<Embed url="https://reddit.com/r/programming/comments/abc123" />
<Embed url="https://youtube.com/watch?v=dQw4w9WgXcQ" />
<Embed url="https://codepen.io/username/pen/abcdef" />
<Embed url="https://gist.github.com/username/1234567890" />
<Embed url="https://mastodon.social/@username/123456789" />
```

### Explicit Platform (Bluesky)

Bluesky URLs don't have unique patterns, so specify the platform:

```mdx
<Embed
  url="https://bsky.app/profile/user.bsky.social/post/123abc"
  platform="bluesky"
/>
```

### LinkedIn (Special Handling)

LinkedIn embeds require the iframe code from the post's "Embed this post" menu option:

```mdx
<Embed platform="linkedin" url="https://www.linkedin.com/embed/feed/update/urn:li:share:123">
  <iframe
    src="https://www.linkedin.com/embed/feed/update/urn:li:share:123?collapsed=1"
    height="593"
    width="504"
    frameborder="0"
    allowfullscreen=""
    title="Embedded post"
  ></iframe>
</Embed>
```

**LinkedIn Implementation Notes**:

- The iframe is wrapped in a responsive container automatically
- Original dimensions (593×504) maintain aspect ratio: 117.86%
- Max-width set to 504px to prevent oversizing on large screens
- No oEmbed or Intersection Observer needed (static content)

## Platform Details

### X (Twitter)

- **oEmbed Endpoint**: `https://publish.twitter.com/oembed`
- **Auto-detection**: URLs containing `twitter.com` or `x.com`
- **Cache**: Uses oEmbed `cache_age` or 24-hour default

### Bluesky

- **oEmbed Endpoint**: `https://embed.bsky.app/oembed`
- **Requires**: Explicit `platform="bluesky"` prop
- **Documentation**: <https://docs.bsky.app/docs/advanced-guides/oembed>

### Mastodon

- **oEmbed Endpoint**: `https://{instance}/api/oembed`
- **Auto-detection**: URLs matching mastodon domains or `/@user/id` pattern
- **Instance Parsing**: Extracts instance domain from URL automatically
- **Documentation**: <https://docs.joinmastodon.org/methods/oembed/>

**Mastodon Implementation Notes**:

- Each Mastodon instance hosts its own oEmbed API
- URL parsing extracts the instance domain (e.g., `mastodon.social`)
- Endpoint constructed as: `https://{instance}/api/oembed?url={encodedUrl}`
- Runtime fetching with localStorage caching (TTL from oEmbed response)
- Falls back to placeholder on fetch failure

### Reddit

- **oEmbed Endpoint**: `https://www.reddit.com/oembed`
- **Auto-detection**: URLs containing `reddit.com`

### YouTube

- **oEmbed Endpoint**: `https://www.youtube.com/oembed`
- **Auto-detection**: URLs containing `youtube.com` or `youtu.be`
- **Placeholder**: Includes media preview area

### GitHub Gist

- **oEmbed**: Not supported (custom implementation)
- **Auto-detection**: URLs containing `gist.github.com`
- **Implementation**: Loads gist using script tag: `{url}.js`

### CodePen

- **oEmbed Endpoint**: `https://codepen.io/api/oembed`
- **Auto-detection**: URLs containing `codepen.io`
- **Placeholder**: Includes media preview area

## Architecture

### Manager Pattern

```typescript
EmbedManager (Singleton LoadableScript)
  - Event: 'delayed'
  - Discovers all [data-embed] elements
  - Creates EmbedInstance for each
  - Manages lifecycle (pause/resume/cleanup)
```

### Instance Pattern

```typescript
EmbedInstance
  - Sets up Intersection Observer
  - Fetches oEmbed data when visible
  - Caches in localStorage
  - Renders embed or handles errors
```

### Intersection Observer Configuration

Matches the scripts/loader 'visible' event settings:

```javascript
{
  root: document.body,
  rootMargin: '0px 0px 500px 0px', // 500px preload
  threshold: 0.01                    // 1% visible
}
```

## Placeholders

Theme-aware placeholders that approximate each platform's layout:

- **Standard Social** (X, Mastodon, Reddit): Header (avatar, name, handle), text content, action buttons
- **Media Platforms** (YouTube, CodePen): Above + media preview area
- **Code Platforms** (GitHub Gist): Monospace font family

Colors use CSS custom properties from theme system:

- Background: `var(--color-bg)`
- Border: `var(--color-border)`
- Skeleton elements: `var(--color-text-offset)`

Includes pulse animation for loading state.

## Caching Strategy

### Cache Key Format

```text
embed_cache_{platform}_{base64(url).substring(0, 50)}
```

### Cache Entry Structure

```typescript
{
  data: OEmbedResponse,      // Full oEmbed response
  timestamp: number,          // Cache creation time
  ttl: number                 // Time-to-live in milliseconds
}
```

### TTL Priority

1. oEmbed response `cache_age` (converted to ms)
2. Default: 24 hours (86,400,000 ms)

### Cache Validation

- Checks timestamp on each load
- Removes expired entries automatically
- Falls back to fresh fetch if cache invalid

## Error Handling

- **Missing Placeholder**: Warns in console, no-op
- **oEmbed Fetch Failure**: Logs error, keeps placeholder visible
- **IntersectionObserver Unavailable**: Falls back to immediate loading
- **Script Execution Errors**: Caught and logged per-embed

## Browser Support

- **Modern Browsers**: Full support with Intersection Observer
- **IE11/Legacy**: Graceful degradation (immediate loading without lazy-loading)
- **Minimum oEmbed Support**: All platforms provide JSON responses

## Files

- `index.astro` - Component template with placeholders
- `client.ts` - Manager and Instance classes with oEmbed logic
- `README.md` - This documentation

## Integration

The component is automatically available in all MDX files via `MarkdownLayout.astro`:

```astro
import Embed from '@components/Social/Embed/index.astro'
export { Embed, ... }
```

The manager registers with the scripts/loader on the 'delayed' event:

```astro
<script>
  import { registerScript } from '@components/scripts/loader'
  import { EmbedManager } from './client'

  registerScript(EmbedManager)
</script>
```

## Performance

- **Lazy Loading**: Only fetches when scrolling into view (500px margin)
- **Cache-First**: Checks localStorage before network requests
- **One-Time Fetch**: Intersection Observer unobserves after loading
- **Singleton Manager**: Single instance manages all embeds
- **Efficient Cleanup**: Removes observers and dead elements on navigation

## Accessibility

- Placeholders use semantic HTML structure
- oEmbed HTML typically includes proper ARIA attributes
- LinkedIn iframes maintain proper accessibility attributes
- Focus management handled by embedded content
