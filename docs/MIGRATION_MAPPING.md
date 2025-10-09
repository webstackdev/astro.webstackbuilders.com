# Eleventy to Astro Migration Mapping

## Overview

This document maps the existing Eleventy/Nunjucks structure to the new Astro structure.

## Directory Structure Mapping

### Current Eleventy Structure → New Astro Structure

```bash
OLD (Eleventy/Nunjucks)          NEW (Astro)
================================ ================================
src/layouts/                    src/layouts/
├── pages/_home.njk            ├── BaseLayout.astro ✅
├── base.njk (missing)         └── PageLayout.astro (new)

src/pages/                     src/pages/
├── _about.njk                 ├── about.astro
├── _contact.njk               ├── contact.astro
├── _privacy.njk               ├── privacy.astro
├── _cookies.njk               ├── cookies.astro
├── _404.njk                   ├── 404.astro
├── _offline.njk               ├── offline.astro
├── _robots.njk                ├── robots.txt.ts
├── articles/_list.njk         ├── articles/index.astro
├── articles/_item.njk         ├── articles/[...slug].astro
├── case-studies/_list.njk     ├── case-studies/index.astro
├── case-studies/_item.njk     ├── case-studies/[...slug].astro
├── services/_list.njk         ├── services/index.astro
├── services/_item.njk         ├── services/[...slug].astro
├── about/_about.njk           ├── about/index.astro
├── contact/_contact.njk       ├── contact/index.astro
├── _generate/_feed.njk        ├── rss.xml.ts ✅
├── _generate/_sitemap.njk     ├── sitemap.xml.ts (new)
├── _generate/_socialtemplate  ├── social-shares/ ✅
└── index.astro ✅             └── index.astro ✅

src/components/                src/components/
├── _hero.njk                 ├── Hero/Hero.astro
├── _testimonials.njk         ├── Testimonials/Testimonials.astro
├── _about.njk                ├── About/About.astro
├── _services.njk             ├── Services/Services.astro
├── _articles.njk             ├── Articles/Articles.astro
├── _cta_contact.njk          ├── CTA/Contact.astro
├── _cta_featured.njk         ├── CTA/Featured.astro
├── _cta_newsletter.njk       ├── CTA/Newsletter.astro
├── _suggestedArticles.njk    ├── Suggested/Articles.astro
├── _suggestedCaseStudies.njk ├── Suggested/CaseStudies.astro
├── _suggestedServices.njk    ├── Suggested/Services.astro
├── callout.js                ├── Callout/Callout.astro
├── signup.js                 ├── Signup/Signup.astro
├── youtube.js                ├── YouTube/YouTube.astro
└── pageSocialImg.js          └── SocialImg/SocialImg.astro

src/lib/                      src/lib/
├── helpers/                  ├── utils/
│   ├── collections.js        │   ├── collections.ts
│   ├── date.js               │   ├── date.ts
│   ├── format.js             │   ├── format.ts
│   └── index.js              │   └── index.ts
├── markdown/                 ├── markdown/
└── state/                    └── state/

src/content/ ✅               src/content/ ✅
└── (already migrated)       └── (already migrated)
```

## Page Mapping Details

### Static Pages

| Nunjucks Template | Astro Page | Notes |
|------------------|------------|-------|
| `_about.njk` | `about.astro` | Single page about |
| `contact/_contact.njk` | `contact.astro` | Contact form page |
| `_privacy.njk` | `privacy.astro` | Privacy policy |
| `_cookies.njk` | `cookies.astro` | Cookie policy |
| `_404.njk` | `404.astro` | Error page |
| `_offline.njk` | `offline.astro` | PWA offline page |

### Collection Pages (Dynamic Routes)

| Nunjucks Template | Astro Page | Route Pattern |
|------------------|------------|---------------|
| `articles/_list.njk` | `articles/index.astro` | `/articles/` |
| `articles/_item.njk` | `articles/[...slug].astro` | `/articles/[slug]/` |
| `case-studies/_list.njk` | `case-studies/index.astro` | `/case-studies/` |
| `case-studies/_item.njk` | `case-studies/[...slug].astro` | `/case-studies/[slug]/` |
| `services/_list.njk` | `services/index.astro` | `/services/` |
| `services/_item.njk` | `services/[...slug].astro` | `/services/[slug]/` |

### Generated/Special Pages

| Nunjucks Template | Astro Page | Notes |
|------------------|------------|-------|
| `_generate/_feed.njk` | `rss.xml.ts` | ✅ Already migrated |
| `_generate/_sitemap.njk` | `sitemap.xml.ts` | Need to create |
| `_generate/_pagesjson.njk` | `api/pages.json.ts` | API endpoint |
| `_robots.njk` | `robots.txt.ts` | Robots.txt generator |

## Component Mapping Details

### UI Components

| Nunjucks Component | Astro Component | Component Type |
|-------------------|-----------------|----------------|
| `_hero.njk` | `Hero/Hero.astro` | Landing page hero |
| `_testimonials.njk` | `Testimonials/Testimonials.astro` | Testimonial carousel |
| `_about.njk` | `About/About.astro` | About section |
| `_services.njk` | `Services/Services.astro` | Services grid |
| `_articles.njk` | `Articles/Articles.astro` | Articles listing |

### CTA Components

| Nunjucks Component | Astro Component | Purpose |
|-------------------|-----------------|---------|
| `_cta_contact.njk` | `CTA/Contact.astro` | Contact call-to-action |
| `_cta_featured.njk` | `CTA/Featured.astro` | Featured content CTA |
| `_cta_newsletter.njk` | `CTA/Newsletter.astro` | Newsletter signup |

### Suggested Content Components

| Nunjucks Component | Astro Component | Purpose |
|-------------------|-----------------|---------|
| `_suggestedArticles.njk` | `Suggested/Articles.astro` | Related articles |
| `_suggestedCaseStudies.njk` | `Suggested/CaseStudies.astro` | Related case studies |
| `_suggestedServices.njk` | `Suggested/Services.astro` | Related services |

## Utility Functions Migration

### Custom Filters → Astro Utils

| Eleventy Filter | Astro Utility | File Location |
|----------------|---------------|---------------|
| `currentPage` | `getCurrentPage()` | `src/lib/utils/collections.ts` |
| `dateToFormat` | `formatDate()` | `src/lib/utils/date.ts` |
| `dateToISO` | `toISODate()` | `src/lib/utils/date.ts` |
| `readableDate` | `readableDate()` | `src/lib/utils/date.ts` |
| `humanizeNumber` | `humanizeNumber()` | `src/lib/utils/format.ts` |
| `obfuscate` | `obfuscateEmail()` | `src/lib/utils/format.ts` |
| `setExt` | `setExtension()` | `src/lib/utils/format.ts` |
| `exclude` | `exclude()` | `src/lib/utils/collections.ts` |
| `findById` | `findById()` | `src/lib/utils/collections.ts` |
| `slice` | `slice()` | `src/lib/utils/collections.ts` |

### Shortcodes → Astro Components

| Eleventy Shortcode | Astro Component | Purpose |
|-------------------|-----------------|---------|
| `{% icon %}` | `<Icon />` | SVG icon display |
| `{% callout %}` | `<Callout />` | Content callout boxes |
| `{% signup %}` | `<Signup />` | Newsletter signup |
| `{% asyncImageHandler %}` | `<Image />` | Responsive images |
| `{% canonical %}` | `getCanonicalURL()` | Canonical URL generation |
| `{% pageTitle %}` | `buildPageTitle()` | Page title construction |
| `{% pageSocialImg %}` | `getSocialImage()` | Social share images |

## Layout Structure

### New Astro Layout Hierarchy

```bash
src/layouts/
├── BaseLayout.astro          # Root layout (HTML structure, head, body)
│   ├── Head/index.astro      # Meta tags, title, etc.
│   ├── Header/index.astro    # Site navigation
│   └── Footer/index.astro    # Site footer
├── PageLayout.astro         # Standard page layout (extends BaseLayout)
├── ArticleLayout.astro      # Article-specific layout
├── CaseStudyLayout.astro    # Case study layout
└── ServiceLayout.astro      # Service page layout
```

## Data Handling

### Data Files Migration

| Current Data | New Location | Notes |
|-------------|--------------|-------|
| `site.11tydata.js` | `src/lib/data/site.ts` | Site metadata |
| `contact.json` | `src/content/data/contact.json` | Contact info |
| `themes.json` | `src/content/data/themes.json` | Theme data |
| `storage.json` | `src/content/data/storage.json` | Storage config |

### Content Collections (Already Migrated ✅)

- Articles: `src/content/articles/`
- Case Studies: `src/content/case-studies/`
- Services: `src/content/services/`
- Testimonials: `src/content/testimonials/`
- Authors: `src/content/authors/`

## Implementation Priority

### Phase 1: Core Structure

1. Create base layouts (`BaseLayout.astro`, `PageLayout.astro`)
2. Migrate utility functions to `src/lib/utils/`
3. Create core components (`Hero`, `Navigation`, `Footer`)

### Phase 2: Static Pages

1. `index.astro` (home page) with Hero and Testimonials
2. `about.astro`
3. `contact.astro`
4. `privacy.astro`, `cookies.astro`, `404.astro`

### Phase 3: Dynamic Pages

1. Articles collection pages
2. Case studies collection pages
3. Services collection pages

### Phase 4: Generated Content

1. `sitemap.xml.ts`
2. `robots.txt.ts`
3. Social share image generation

### Phase 5: Advanced Features

1. Search functionality
2. Theme switching
3. Service worker integration

## Notes

- ✅ = Already implemented
- Components should use TypeScript (.astro extension)
- Maintain existing URL structure for SEO
- Preserve all meta tags and structured data
- Keep existing CSS classes and styles
