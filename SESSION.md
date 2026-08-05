# Remove current articles, rename deep dives to articles, and remove all deep dive functionality

## Background

Each `src/content/articles/<slug>/` directory used to contain two content items:

- `index.mdx` — a short-form "overview" article served at `/articles/<slug>`
- `pdf.mdx` — a long-form "deep dive" served at `/deep-dive/<slug>` (loaded into the
  separate `deepDives` content collection with a custom `generateId` that stripped
  the `/pdf` suffix)

The short-form pages were marked `noindex, follow` with a canonical link pointing at
their `/deep-dive/<slug>` counterpart, and `/articles/<slug>` URLs were excluded from
the sitemap via `deepDiveAliases`. This dual-URL setup caused Google indexing
problems, so we are consolidating to a single long-form article per topic at
`/articles/<slug>`.

## Already completed (content migration)

Committed in `5a968d90` and `ef2e347d`:

- Deleted the original short-form `index.mdx` files.
- Renamed every `pdf.mdx` to `index.mdx`.

Current state of each article directory: `index.mdx` (long-form), `download.mdx`,
`cover.jpg`, `download.jpg`, `diagrams/`. Consequences already in effect:

- The `articles` collection (glob `**/index.mdx`) now loads the long-form content. No
  glob change needed for `articles`.
- The `deepDives` collection (glob `**/pdf.mdx`) now matches **zero** files — all
  `getCollection('deepDives')` call sites currently return empty arrays. Every such
  call site must be migrated or removed (see below).

## Implementation plan

### 1. Content collections — `src/content.config.ts`

- Remove the `deepDiveArticlesCollection` definition (the `defineCollection` block
  with `pattern: '**/pdf.mdx'`).
- Remove the `generateDeepDiveId` helper (only used by that loader).
- Remove `deepDives: deepDiveArticlesCollection` from `export const collections`.
- Keep `articles` as-is; it now globs the former deep-dive content.
- Keep `downloads` (`**/download.mdx`) untouched — `download.mdx` files still exist.

### 2. Routing

- **Delete** `src/pages/deep-dive/[...slug].astro` (whole `src/pages/deep-dive/` dir).
- **301 redirects (SEO-critical).** The `/deep-dive/<slug>` URLs are the ones Google
  indexed (the `/articles/<slug>` versions were `noindex`). They must permanently
  redirect to `/articles/<slug>`:
  - Add to `vercel.json` a `redirects` entry:
    `{ "source": "/deep-dive/:path*", "destination": "/articles/:path*", "permanent": true }`
  - Also replace `src/pages/deep-dive/[...slug].astro` with a redirect stub so
    dev/preview behave the same as production: `getStaticPaths()` over the `articles`
    collection, then `return Astro.redirect(`/articles/${Astro.params.slug}`, 301)`.
    (If preferred, this stub can be deleted once Vercel redirects are verified live.)
- **Simplify** `src/pages/articles/[...slug].astro`:
  - Remove the `getCollection('deepDives', ...)` call, `deepDiveIds`, and the
    `canonicalPath` prop logic (`/deep-dive/<id>` canonical).
  - Remove `robotsContent` (`noindex, follow`) — articles become indexable canonical
    pages.
  - Remove the now-unused `canonicalPath` from `Props`.

### 3. Switcher component (delete entirely)

Delete `src/components/Content/Switcher/`:

- `index.astro`, `index.css`
- `client/index.ts`, `client/selectors.ts`, `client/__tests__/`
- `server/index.ts`, `server/__tests__/`

Call sites and plumbing:

- `src/components/Content/Layout/index.astro` — remove the
  `import ContentSwitcher from '@components/Content/Switcher/index.astro'` and the
  `<div class="pr-4" slot="breadcrumb-row"><ContentSwitcher path={path} /></div>`
  block.
- `src/layouts/MarkdownLayout.astro` — remove the `breadcrumb-row` slot forwarding
  (`<slot name="breadcrumb-row" slot="breadcrumb-row" />`).
- `src/layouts/BaseLayout.astro` — remove `hasBreadcrumbRowSlot` and its use in
  `shouldRenderBreadcrumbRow` (which becomes simply `path !== '/' && path !== ''`),
  the `<slot name="breadcrumb-row" />` render block, and the ContentSwitcher comment.
- Nanostores: **no nanostore code exists for the Switcher** — it is a LitElement with
  idle-prefetch logic only; nothing in `src/components/scripts/store/` references it.
  (The `toggle theme switcher` locator in e2e `BasePage.ts` is the ThemePicker and is
  unrelated.) No store work needed.

### 4. Content layout — `src/components/Content/Layout/index.astro`

- Remove `CollectionEntry<'deepDives'>` from the `article` prop union.
- Replace the `relatedContentType` conditional
  (`path.startsWith('/deep-dive/') || canonicalPath ? 'deep-dive' : 'articles'`)
  with a constant `'articles'` for the Carousel `type`.
- Remove the `canonicalPath` and `robotsContent` props from `Props` and the
  MarkdownLayout pass-throughs if no other caller uses them after step 2 (verify with
  a grep for `canonicalPath` across pages; `MarkdownLayout`/`Head` keep their own
  generic support — unit tests there just need fixture updates, see step 10).

### 5. Collection consumers — switch `deepDives` to `articles`

- `src/pages/articles/index.astro` — `getCollection('deepDives')` →
  `getCollection('articles')`; rename `allDeepDives`/`getDeepDivesForTag` locals;
  Carousel `type="deep-dive"` → `type="articles"`; update copy: page description
  "Browse technical deep dives…" and the "N deep dives" badge.
- `src/pages/index.astro` (homepage "Latest Insights") — Carousel
  `type="deep-dive"` → `type="articles"`.
- `src/pages/rss.xml.ts` — `getCollection('deepDives')` → `'articles'`; item link
  `/deep-dive/${article.id}` → `/articles/${article.id}`.
- `src/pages/print/[...slug].astro` — `Props.article` type and
  `getCollection('deepDives')` → `'articles'`. The QR/copyright link already points
  at `/articles/<id>`; keep it.
- `src/components/Layout/Print/Cover/index.astro` — prop type
  `CollectionEntry<'deepDives'>` → `CollectionEntry<'articles'>`.
- `src/layouts/MarkdownLayout.astro` — remove `CollectionEntry<'deepDives'>` from
  the `collectionItem` union.
- `src/components/Pages/TagPage/index.astro` — card href
  `` `/deep-dive/${item.id}` `` → `` `/articles/${item.id}` `` (the tag pagination
  helper `src/lib/tags/pagination.ts` already queries the `articles` collection).
- `src/components/Carousel/@types/index.ts` — remove `'deep-dive': 'deepDives'`
  from `collectionMap`. Item hrefs are built as `/${type}/${item.id}`, so no other
  Carousel change is needed; check `server/__fixtures__/collection.fixture.ts` and
  server tests for `deepDives` references.
- `src/components/Breadcrumbs/index.astro` — remove `rewriteBreadcrumbHref`
  (`/deep-dive` → `/articles`) and its two call sites (JSON-LD schema item URL and
  the link `href`).
- `src/components/Search/SearchResults/client/index.ts` — remove
  `'deep-dive': 'Deep Dive'` from `resultTypeLabels`.

### 6. Sitemap — `src/integrations/sitemapSerialize/` + `astro.config.ts`

- Delete `src/integrations/sitemapSerialize/deepDiveAliases.ts` and
  `src/integrations/sitemapSerialize/__tests__/deepDiveAliases.spec.ts`. (This module
  generated `/articles/<slug>` paths to *exclude* from the sitemap; after
  consolidation those URLs are canonical and must be *included*.)
- `astro.config.ts` — remove the `getDeepDiveArticleAliasPaths` import, the
  `deepDiveArticleAliasPaths` const, and `...deepDiveArticleAliasPaths` from the
  sitemap `exclude` array. `/deep-dive/*` URLs disappear from the sitemap
  automatically when the route is removed.

### 7. PDF generation — `scripts/generate-pdfs/index.mjs`

- `collectAllSlugs()`: existence check `join(ARTICLES_DIR, e.name, 'pdf.mdx')` →
  `'index.mdx'`.
- Single-slug validation: `pdf.mdx` → `index.mdx`, plus error message text
  ("No pdf.mdx found", "No deep dive articles with pdf.mdx found", header usage
  comment).
- No change to the render URL (`/print/<slug>`), output dir (`public/downloads/`),
  or the `pdf:generate` npm script name.

### 8. Search indexing — `scripts/search-index.py` + `.github/workflows/search.yml`

- `scripts/search-index.py`: remove the
  `CollectionConfig(name="deep-dive", url_prefix="/deep-dive", source_dir="articles", glob_pattern="**/pdf.mdx")`
  entry from `COLLECTIONS`. The `articles` entry (`**/index.mdx`) now indexes the
  long-form content at the correct `/articles/<slug>` URLs.
- `.github/workflows/search.yml`: in "Index changed collections", drop
  `--collection deep-dive` from the `crawl_articles` branch.
- The `determine-search-index-scope` and `prune-upstash-search` composite actions are
  collection-agnostic (parameterized) — no changes needed.
- **One-time operational step after deploy:** the live Upstash index contains stale
  `/deep-dive/*` documents that the incremental `--no-drop` CI run will not remove
  (the prune step only covers the `articles` collection). Run a full reindex once
  manually — `npm run search:reindex` (drops and rebuilds the index by default) —
  with production Upstash credentials.

### 9. GitHub workflows — other

- Grepped all of `.github/workflows/`: only `search.yml` references deep-dive/pdf.
  `cron.yml`, `deployment-*.yml`, `playwright.yml`, etc. need no changes. PDFs are
  generated manually (`npm run pdf:generate`) and committed under
  `public/downloads/`; no CI job generates them.

### 10. Unit tests

- Delete: `src/components/Content/Switcher/**/__tests__/` (covered by step 3),
  `src/integrations/sitemapSerialize/__tests__/deepDiveAliases.spec.ts`.
- Update fixtures that use `/deep-dive/...` example URLs:
  - `src/components/Head/__tests__/Meta.spec.ts`
    (`canonicalPath: '/deep-dive/example-article'` and expected URL)
  - `src/components/Head/server/__tests__/structuredData.spec.ts` (same fixture;
    expects `https://www.webstackbuilders.com/deep-dive/example-article`)
  - `src/components/Search/SearchBar/client/__tests__/results.spec.ts` and
    `index.spec.ts` (deep-dive URLs — functionally generic, update to `/articles/...`
    for consistency)

### 11. E2E tests — `test/e2e/`

- `specs/01-smoke/dynamic-pages.spec.ts` — `articleLinkSelector =
  'a[href*="/deep-dive/"]'` → `/articles/`; URL assertion `/\/deep-dive\/.+/` →
  `/\/articles\/.+/`.
- `specs/02-pages/articles.spec.ts` — expects navigation to `/deep-dive/<slug>`;
  change to `/articles/<slug>`.
- `specs/02-pages/tags.spec.ts` — `a[href^="/deep-dive/"]` → `a[href^="/articles/"]`.
- `specs/07-metadata/seo-tags.spec.ts`, `open-graph.spec.ts`,
  `structured-data.spec.ts` — drop the `a[href^="/deep-dive/"]` alternative from
  `articleDetailLinkSelector`.
- `helpers/pageObjectModels/BreadCrumbPage.ts` — simplify `linkSelector` and update
  `notFoundMessage` ("Could not find deep-dive or article detail link…").

### 12. Support files / housekeeping

- `.gitignore` — no pdf/deep-dive entries exist; `public/downloads/` PDFs are
  committed intentionally. Under the existing "Planning docs" section
  (`CONTENT*.md`), consider adding `SESSION.md` if this plan should stay uncommitted.
- `_TODO.md` — remove the stale line about the Switcher component bug (component is
  being deleted).
- `package.json` — no script renames needed (`pdf:generate`, `search:reindex`
  unchanged).
- Content files: verified no MDX links to `/deep-dive/...` exist (only image
  filenames like `*_deep-dive.jpg` and prose, which are fine).

## Validation checklist

1. `npx astro sync` — schema/types regenerate without `deepDives`.
2. `npx tsc --noEmit -p tsconfig.json --pretty false` — no dangling
   `CollectionEntry<'deepDives'>` types.
3. `npm run lint:code` and `npm run check`.
4. `npm run test:unit` — Switcher/alias specs gone; updated fixtures pass.
5. `npm run build` — confirm: no `/deep-dive/` pages emitted; `/articles/<slug>`
   pages present; sitemap includes `/articles/*` and excludes nothing article-related;
   `rss.xml` links to `/articles/*`.
6. `npm run test:e2e` (at least `@smoke` + the updated specs).
7. Manual spot-check: `npm run dev` → article page renders long-form content at
   `/articles/<slug>`, no Switcher in breadcrumb row, related-content carousel links
   to `/articles/*`, `/deep-dive/<slug>` 301s to `/articles/<slug>`.
8. Optionally regenerate one PDF: start preview server, then
   `node scripts/generate-pdfs/index.mjs <slug>`.

## Post-deploy SEO / ops

1. Verify the Vercel 301 redirect live:
   `curl -I https://www.webstackbuilders.com/deep-dive/<some-slug>` → `301` to
   `/articles/...`.
2. Run the one-time full Upstash reindex (see step 8) to purge `/deep-dive/*` search
   documents.
3. In Google Search Console: submit the updated sitemap, use URL Inspection on a few
   `/deep-dive/*` URLs to confirm the redirect is picked up, and monitor coverage for
   the consolidated `/articles/*` URLs.
