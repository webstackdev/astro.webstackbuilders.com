<!-- markdownlint-disable-file -->
# TODO

## Bot Detection

We added a honeypot. Further options are Cloudflare Turnstile and Google Recaptcha v3. I added notes in CONTACT_BOT_DETECTION.md for implementation.

## Chat bot tying into my phone and email

Vercel AI Gateway, maybe could use for a chatbot:

https://vercel.com/kevin-browns-projects-dd474f73/astro-webstackbuilders-com/ai-gateway
https://aws.plainenglish.io/how-to-build-a-chatbot-using-aws-lex-and-lambda-in-2026-aeeff5e13f4a

## Link Validator

- Re-enable link validator in `astro.config.ts` when pdf / downloads sorted out

## Contact Page File Uploads

- Uppy, Tus server, whatever other server needed for file upload on Contact Form component
- Contact page Uppy file upload not displaying. Submit button is huge on Contact page.

## Header - "Squish" Effect

- Need to improve the "squish" animation where the header reduces in size on scroll down, and returns to full size on scroll up. Maybe reduce and expand the text and search / themepicker / hamburger menu sizes in place, and then slide them horizontally.
- Moving the scroll bar up quickly with the mouse seems to make the header logic break - the Switcher component and Breadcrumbs are hidden under the header
- Themepicker and search icon are too big in non-squished header. Logo too - the initial presentation should be smaller.

## Resume

- Finish styling

## Contact Form

- `0/2000` characters should show number of characters left instead
- Workflow right now puts the "Success" toast under the submit button when the submit button returns to normal after a submission. It seems like the button should have some time out after a successful submission to make sure it's not hammered, like five seconds. And it just looks visually odd - maybe the button should be part of the layout of the success toast, or moved down under it.

## Newsletter / MJML Templates

- Need to move the unsubscribe link into an Action and handle it entirely within our website instead of on Hubspot
- Need to add a newsletter publishing workflow as an action, using the newsletter static segment imported from Hubspot

## Performance Issues

### Home page size

- Audit the homepage hydration/chunk fan-out after prerendering. The 22 JS chunks suggest too much client code is shipping for a marketing landing page.

No edits made. This is an audit of the current built homepage.

The prerendered homepage still ships 22 direct module scripts from index.html:99, index.html:181, index.html:193, and index.html:230. The direct script total is 286,449 bytes before any imported shared chunks. That means the real network cost is higher, because these entries pull shared runtime pieces like Embla, Lit helpers, custom-element helpers, and GSAP.

Roughly 165 KB of the direct JS is shell cost, not homepage content. The main driver is the always-on bootstrap from index.astro:64, which becomes the 101,517-byte top chunk and initializes consent, animation lifecycle, header search, and layout side effects from the bootstrap module. On top of that, the layout always includes BaseLayout.astro:134, BaseLayout.astro:144, BaseLayout.astro:147, BaseLayout.astro:190, and BaseLayout.astro:191. Header search and nav add more fixed cost through index.astro:62, index.astro:70, index.astro:151, and index.astro:179. The marketing homepage is paying for a full app shell.

The biggest homepage-specific cost is the Terraform hero animation, not the tiny hero text effect. The 80,510-byte entry is emitted before the hero markup in index.html:185, and the animation is registered from index.astro:605 with a GSAP-heavy client in index.ts:149. The actual hero custom element registration is separate and small in index.astro:95.

The newsletter block fans out into three separate direct entries. The form itself registers in index.astro:83, while the nested form content also pulls index.astro:30 and index.astro:93. You can see the three adjacent newsletter-related script entries in index.html:193 and index.html:212. Combined direct cost there is about 28 KB before shared imports.

The carousel family is the next meaningful page-local contributor. Skills, latest insights, and testimonials each register separate custom elements in index.astro:125, index.astro:279, and index.astro:186. Their direct entry files are not individually huge, but they multiply the request graph and pull shared Embla infrastructure.

The current use of whenIdle is not reducing chunk fan-out. It delays registration work, but it does not stop Astro from emitting direct module script tags into the prerendered HTML. That is visible for index.astro:88, index.astro:605, index.astro:279, and index.astro:186, and those scripts still show up in index.html:181 and index.html:193. So it helps execution timing, not shipped JS count.

The highest-leverage reductions are clear. First, remove or aggressively defer the Terraform animation. Second, split the marketing homepage off the full app shell so it does not inherit ClientRouter, search, theme picker, bug reporter, and other global interactive infrastructure by default. Third, flatten the newsletter block into a simpler home-page variant without confetti and custom checkbox logic unless the user actually interacts.

1. I can turn this into a concrete implementation plan with estimated byte savings per change.

2. I can make the highest-value first cut now: remove or defer the Terraform animation and rebuild to remeasure.

3. I can create a lighter marketing layout for the homepage and remeasure the shell cost.

I would not start from PageLayout.astro:1, because it still inherits BaseLayout.astro:1. The clean version is a new marketing-only layout that sits much closer to PrintLayout.astro:1: same CSS pipeline and meta surface, but without the app shell.

What that would look like in practice:

- Keep the global CSS imports and the document skeleton from PrintLayout.astro:1.
- Keep the meta tags from index.astro:1, but split them so the homepage does not automatically pull index.astro:64.
- Drop BaseLayout.astro:134, BaseLayout.astro:144, BaseLayout.astro:147, BaseLayout.astro:194, BaseLayout.astro:190, BaseLayout.astro:191, and BaseLayout.astro:192 for the first pass.
- Replace the current interactive header and footer with static marketing variants, because the current header/footer bring search, theme toggle, footer custom-element registration, and bug reporter behavior through index.astro:1 and index.astro:1.
- Leave the homepage content in index.astro:1 unchanged at first, so the measurement isolates layout-shell savings before you touch hero, carousels, or newsletter behavior.

Conceptually, it would be closer to this:

```markdown
---
import '@styles/index.css'
import '@styles/icons.css'
import Meta from '@components/Head/Meta.astro'
import ThemeInit from '@components/Head/ThemeInit.astro'
import MarketingHeader from '@components/Marketing/Header.astro'
import MarketingFooter from '@components/Marketing/Footer.astro'
---

<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8" />
    <ThemeInit />
    <Meta ... />
  </head>
  <body class="invisible">
    <a href="#main" class="sr-only">Skip to main content</a>
    <MarketingHeader />
    <main id="main">
      <slot />
    </main>
    <MarketingFooter />
  </body>
</html>
```

The important part is what is missing, not what is added: no bootstrap script, no view transitions router, no shell web components, no PWA plumbing, no analytics, no footer bug reporter, no search, no theme-picker island.

For remeasuring shell cost, I would do it in two passes:

1. Build the homepage against that stripped marketing layout and rerun the same index.html script extraction you already used. That gives you "current homepage content + lighter shell".

2. Build one temporary blank marketing page with the same layout and almost no body content. That gives you the shell baseline by itself.

That second number is the one you actually want if the question is "what does the homepage pay just for the shell?" Right now your current measurement is a mix of shell cost and page-local cost. A lighter layout lets you separate them cleanly.

The existing repo precedent for this is PrintLayout.astro:1. The structural lesson from that file is correct: a truly light layout is a separate layout, not a flag on BaseLayout.astro:1. Once you start making BaseLayout conditional, you usually keep most of the bundle edges anyway.

If you want, I can next turn this into a concrete change proposal with:

1. the exact components I would remove from the homepage shell first,
2. the likely script entries that would disappear,
3. the order I would test them in so the deltas stay attributable.

I'm narrowing this to the behavioral decision: which shell features should be absent on the homepage versus deferred behind explicit triggers, so the answer stays operational instead of theoretical.Not by default. The point of a lighter homepage layout is that most of those features should simply be absent on /, not secretly reintroduced through another global loader.

The right split is:

- Features that can just not exist on the homepage: BaseLayout.astro:134, footer bug reporter, header search, tooltip shell, and the full bootstrap from index.astro:64. If they are not rendered, nothing is broken; the homepage just behaves like a normal static marketing page.

- Features that can be deferred only if the homepage still needs them: analytics, consent UI, theme picker, and maybe service worker registration. Those should be loaded by explicit need, not by a generic site bootstrap.

A good rule is: if a user cannot discover the missing behavior on the homepage, do not lazy load it there. Just omit it.

What that means feature by feature:

- View transitions router: do not lazy load it on the homepage. If BaseLayout.astro:134 is absent, links from home still work as normal full-page navigations. Then once the user lands on an interior page that uses BaseLayout.astro:1, view transitions can resume there. Nothing is broken; you just give up SPA-style transitions on the landing page.

- Bootstrap script: do not replace one big bootstrap with a lazy bootstrap. That just moves the cost later and keeps the coupling. The better move is to stop treating index.astro:64 as mandatory for every page, and only load the specific feature modules that a given page actually needs.

- Search: unless homepage search is a product requirement, it should not work there because it should not exist there. If you want a search affordance on home, that is a good candidate for interaction-triggered loading.

- Theme picker: separate "theme is applied" from "theme picker UI exists." The tiny theme-init path can still run so the page honors stored theme without FOUC, but the picker island itself can be absent on home. If you keep a theme control on home, then load that UI on click.

- Consent banner: this is the one I would not hand-wave away. If your policy requires consent controls on first entry, keep the minimal consent affordance on the homepage. But even here, I would aim for a narrow consent-specific loader, not the whole shell.

- Analytics: if you need marketing attribution on the homepage, defer it independently after consent or after initial render. If you are measuring shell cost, it should not be bundled through the shared page shell.

- PWA plumbing: for a marketing homepage, I would usually omit service worker registration and offline prefetch on /. Those features can begin on later app-like pages if they still matter.

So the short answer is: some things should intentionally not work on the homepage because they are not part of the homepage experience. Only lazy load the subset that is both valuable on / and user- or policy-driven.

The mistake to avoid is "minimal layout plus hidden global rehydration." If you do that, you keep the same architecture and mostly just delay the pain.

If you want, I can map these into three buckets next:

1. omit entirely on /
2. keep but defer on /
3. keep synchronous on / because they are required for correctness or compliance

 I'm going to turn the shell features into three decision buckets, then separate "hidden global rehydration" from legitimate targeted deferral so the tradeoff is explicit.This is the mapping I would use for the homepage.

#### Bucket 1

Omit entirely on the homepage.

- View transitions router. If BaseLayout.astro:134 is not used on the homepage, links still work through normal navigations. You lose transition polish on entry, but not functionality.

- Global bootstrap. The large boot path from index.astro:64 should not exist on a marketing landing page unless a concrete homepage feature needs it.

- Header search. If search is not a primary homepage action, do not ship it there through Header.

- Theme picker UI. Keep theme application if needed, but omit the picker island itself from BaseLayout.astro:147.

- Footer bug reporter and footer enhancement logic from Footer.

- Tooltip shell. That is app chrome, not marketing-page core.
- PWA offline prefetch. The homepage does not need to pay for PrefetchOfflinePage.

#### Bucket 2

Keep only if needed, and defer behind an explicit trigger or policy boundary.

- Analytics. If you need attribution on first entry, load analytics independently after consent or after first paint. Do not inherit it from the shared shell in BaseLayout.astro:190.

- Consent UI. This is the strongest candidate for "keep, but narrow." If the site needs consent handling on first visit, load only the consent path from Consent/Banner, not the whole app shell.

- Theme picker, but only if you expose a theme control on the homepage. If there is no control, do not load the picker.

- Search, but only if you make search a visible homepage action. Then load it on click or open, not on page load.
Service worker registration, but only if there is a real homepage product reason. Usually I would start with "off on home" and justify it back in later.

#### Bucket 3

Keep synchronously because it is required for correctness, presentation, or compliance.

- Critical metadata and head tags from src/components/Head/index.astro, but split away from the bootstrap entry.
Theme initialization only, if you need to avoid flash-of-wrong-theme. That is different from keeping the theme picker.

- Basic skip link and static header/footer structure.

- Any legally required consent placeholder if policy requires that users can immediately see or access privacy controls on first entry.

#### "Minimal layout plus hidden global rehydration" is not a synonym for deferred loading.

They look similar from far away because both reduce some upfront execution, but architecturally they are different.

**Deferred loading, used well, means:**

- the homepage starts with a genuinely smaller feature surface

- only a specific feature bundle is loaded later

- the trigger is explicit, like consent accepted, user clicked search, user opened theme control, or a clearly bounded idle task

- the deferred bundle is local to that feature

**Hidden global rehydration means:**

- you render a minimal-looking layout on the server

- but you still attach a general-purpose client bootstrap later

- that bootstrap scans the page, wires up many shell behaviors, and starts recreating the same global runtime you thought you removed

- the coupling is still global, so the homepage remains architecturally tied to the app shell even if the work happens later

So the difference is not timing alone. It is scope and coupling.

A good smell test is this:

- If the later-loaded code says "initialize homepage search," that is targeted deferral.

- If the later-loaded code says "initialize the site" or "bootstrap all shell behaviors," that is hidden global rehydration.

**Why hidden global rehydration is usually the wrong move here:**

- It often preserves most of the total JS cost, just shifted later.

- It keeps shared dependencies sticky, so the homepage still drags the app shell architecture behind it.

- It can improve some Lighthouse timings while still hurting real-user experience on slower devices once idle work kicks in.

- It makes attribution harder, because the homepage no longer has a clean boundary between what belongs to marketing and what belongs to the application shell.

**Why targeted deferral is still useful:**

- It lets the homepage stay mostly static.

- It preserves specific high-value behaviors.

- It makes the bundle graph legible: this feature exists because the user did something that asked for it.

**So my recommendation is not "defer everything." It is:**

- Remove whole homepage-irrelevant shell features.

- Keep only the smallest synchronous primitives needed for correctness.

- Defer a small number of user-discoverable or compliance-driven features with feature-specific loaders.

- Avoid any replacement that effectively recreates index.astro:64 under a different name.

If we evaluate this tomorrow, the practical decision framework is simple:

- If a homepage visitor would never miss it, omit it.
- If they only need it after an action, defer it specifically.
- If the page is broken or non-compliant without it, keep it synchronous.

If you want tomorrow, I can turn this into a concrete scorecard for each current homepage shell feature with columns for user value, compliance risk, likely byte impact, and recommended bucket.

#### Chunk weight

Vercel supports both gzip and brotli, and if the client supports Brotli, Vercel prefers Brotli over gzip for eligible text assets like HTML, CSS, and JavaScript.

From the current built homepage, the JS breaks down like this:

Direct entries: about 279.7 KB raw, 100.0 KB gzip
Shared chunks: about 45.7 KB raw, 17.5 KB gzip

Total JS graph for the homepage: about 325.5 KB raw, 117.4 KB gzip

Homepage CSS only:

Total CSS raw: 220,895 bytes, about 215.7 KB
Total CSS gzip: 34,691 bytes, about 33.9 KB
Total CSS Brotli estimate: 28,242 bytes, about 27.6 KB

And for the Brotli side of the JS audit:

Total reachable homepage JS Brotli estimate: 106,493 bytes, about 104.0 KB

If you want the full first-load asset picture from the current build:

JS + CSS raw: 554,167 bytes, about 541.2 KB
JS + CSS gzip: 154,920 bytes, about 151.3 KB
JS + CSS Brotli estimate: 134,735 bytes, about 131.6 KB

What that means in practice:

The 22 entry chunks are not a strict A -> B -> C -> D chain. They should mostly look like a stack.
But there is still a second-wave dependency step for shared imports, so it is not a perfectly flat stack either.
In the current build, the shared JS layer is only 3 chunks deep and the max dependency depth is 1, so this is a one-step staircase, not a long waterfall.
The three shared chunks currently causing that extra step are:

- embla-carousel.esm
- focus-trap.esm
- workbox-window.prod.es5

So the honest answer is:

- No, you do not appear to have a severe multi-hop dependency waterfall.
- Yes, you do have some waterfall behavior because shared chunks are not preloaded and must be discovered from the entry modules.

The bigger problem on this homepage is still total shipped JS and chunk fan-out, not a deep chained graph. If you opened DevTools, I would expect "mostly stacked direct requests, plus a smaller second wave" rather than a long staircase.

If you want, I can next turn that into a plain-English takeaway for your _TODO.md, like: "fan-out is the main issue; dependency waterfall is present but shallow."

### Search page

One route that is dynamic now but probably does not need to be:

/search

It is currently marked prerender = false in index.astro:2, but the UI is already client-driven. index.astro:8 reads q, and the real search happens through the action in action.ts:12. That means /search can very likely be a static shell page and let the client read window.location.search and call the action. So I would not keep this dynamic unless you specifically want SSR-rendered search results for SEO.

### Tags page

One caution:

src/pages/tags/[tag].astro is prerendered but also reads ?page=. That is not a reason to keep it dynamic, but it is a sign that query-param pagination there may not be doing what you expect in a prerendered route.

It's using page for plain old server-side pagination.

In src/pages/tags/[tag].astro, the route sets ITEMS_PER_PAGE = 12, then reads the query param here:

src/pages/tags/[tag].astro


const currentPage = parseInt(Astro.url.searchParams.get('page') || '1')
It uses that value to:

Compute the slice boundaries:
src/pages/tags/[tag].astro

const startIndex = (currentPage - 1) * ITEMS_PER_PAGEconst endIndex = startIndex + ITEMS_PER_PAGE
Slice the sorted articles for that tag:
src/pages/tags/[tag].astro

const paginatedContent = sortedContent.slice(startIndex, endIndex)
Render the pagination UI and link targets:
src/pages/tags/[tag].astro
That block builds:

Previous / Next
numbered page links
ellipsis when there are many pages
links like /tags/foo?page=2, /tags/foo?page=3, etc.
So the intent is:

/tags/some-tag means page 1
/tags/some-tag?page=2 means articles 13-24
/tags/some-tag?page=3 means the next 12, and so on
One important caveat: this route is also marked prerendered in src/pages/tags/[tag].astro. That means the code is written like SSR pagination, but because the route is static, the page query param may not actually produce distinct server-rendered HTML at runtime. In other words, the code is trying to use ?page= to choose which slice to render, but prerendering makes that suspicious.
