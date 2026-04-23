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

3. Audit the homepage hydration/chunk fan-out after prerendering. The 22 JS chunks suggest too much client code is shipping for a marketing landing page.

### Cache Header

I addressed it by adding an explicit Vercel header rule in vercel.json for /_astro/(.*) with:

Cache-Control: public, max-age=31536000, immutable
CDN-Cache-Control: public, max-age=31536000, immutable
Vercel-CDN-Cache-Control: public, max-age=31536000, immutable
That is the right fix surface for this issue, because the problem appears to be deployment/header behavior, not the asset build itself.

One important detail from validation: the generated Astro build output in config.json:19 still shows Astro's own _astro header route after handle: filesystem, which is exactly why I didn't rely on that generated rule. The explicit vercel.json config is meant to be applied by Vercel at deploy time, outside that Astro route ordering.

So:

Code/config change: done
Local build: passed
Local proof of final deployed header behavior: not possible from astro build output alone
Real verification step: after deploy, run curl -I https://www.webstackbuilders.com/_astro/<some-built-asset>.js
What you should expect after deploy:

Cache-Control: public, max-age=31536000, immutable
x-vercel-cache behavior should improve for those assets
Vercel-CDN-Cache-Control may be consumed by Vercel and not echoed back
If you want, once this deploy finishes I can verify a live _astro asset header and confirm whether this actually fixed production caching.

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
