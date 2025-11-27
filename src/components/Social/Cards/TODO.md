# How cards are provided currently

index.astro is included in every layout; it renders Meta.astro, which in turn renders Social.astro.

Social.astro builds the full Open Graph + Twitter meta block. It calls getSocialMetadata from index.ts with the current page title, description, slug, and optional image.

getSocialMetadata normalizes the site base URL, then either uses the page's explicit image (if provided) or calls getSocialImage. That helper composes a URL to the serverless endpoint index.ts.

The /api/social-card endpoint accepts title, description, slug, etc., and returns an HTML template styled as our share card; that URL is what ends up in og:image / twitter:image. Social platforms fetch the URL declared in those meta tags, so the card they render comes entirely from the metadata emitted by Head/Social.

The Social/Shares component (Shares.astro) doesn't generate cards; it just renders on-page share buttons. Each platform config in platforms.ts produces a share URL (or, for Mastodon, opens our modal) using the already-published page URL and text. Those buttons rely on the card metadata above so platforms show the correct preview when the shared link is opened.
Next steps (optional)

If you need richer cards (dynamic screenshots, branded variants), enhance /api/social-card or point getSocialImage at an external image generator.
To customize per-page artwork, pass an image prop from frontmatter so Head/Social uses that instead of the auto-generated URL.
