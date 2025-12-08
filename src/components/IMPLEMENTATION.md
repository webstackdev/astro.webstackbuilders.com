# Toc Component Refactor Plan

## Goals

- Keep the table of contents rendering strictly server-side
- Remove the Preact-based `TocList` helper
- Provide a reusable data structure for rendering nested headings directly inside `index.astro`
- Leave room for upcoming Lit web component work and container-based tests

## Steps

1. **Server Helper**
   - Create `src/components/Toc/server/index.ts` exporting:
     - `interface TocItem` describing `{ slug, text, depth, children }`
     - `buildTocTree(headings: MarkdownHeading[]): TocItem[]` that mirrors the previous stack/children algorithm.
   - Ensure the helper contains no JSX and can be tree-shaken.

2. **Astro Template Rendering**
   - Update `src/components/Toc/index.astro` to import `buildTocTree` and `TocItem` from the server helper.
   - Remove the Preact `TocList` import/usage.
   - Iterate over the returned nested data structure directly in the template (using inline recursion inside the markup) to render nested `<ol>` elements.

3. **Cleanup**
   - Delete `src/components/Toc/TocList.tsx` and any now-unused imports/exports.
   - Verify that no other files import the old helper.

4. **Follow-up (future PRs)**
   - Implement the Lit-based client behavior (if needed) using the existing `@components/Test/webComponent` pattern.
   - Add Astro Container API tests for the TOC once the server rendering is in place.
