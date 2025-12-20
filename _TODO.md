<!-- markdownlint-disable-file -->
# TODO

## Refactor API Endpoints to Astro Actions

### Action / Domain / Responder Pattern

- The action takes HTTP requests (URLs and their methods) and uses that input to interact with the domain, after which it passes the domain's output to one and only one responder.

**Here you define the route and the methods (get, post, put, delete)**

`/actions` or `actions.ts`

- This layer contains the business logic and the persistence logic (e.g., using a repository pattern or similar data mappers). The domain services are responsible for reading from and writing to the database to fulfill business requirements.

`/domain`

- The Domain is an entry point to the domain logic forming the core of the application, modifying state and persistence as needed. This may be a Transaction Script, Service Layer, Application Service, or something similar. The Domain in ADR relates to the whole of the domain objects, all the entities and their relations as a whole

`/entities` or `entities.ts`

- Entities are part of the domain. They represent state and core business rules, but not persistence logic. Defined primarily by its unique identity, rather than its attributes or properties.

- By any name the Domain Payload Object is a specialized Data Transfer Object. A Data Transfer Object is a fine-grained object, providing properties that mirror or at least shadow properties found on the domain objects that they replicate. A Domain Payload Object is a coarse-grained object that transfers whole domain object instances to the client.

`/responders` or `responders.ts`

- The responder builds the entire HTTP response from the domain's output which is given to it by the action. The Responder is responsible solely for formatting the final response (e.g., JSON, HTML) to be sent back to the client.

### Endpoints:

- cron/cleanup-confirmations → GET
- cron/cleanup-dsar-requests → GET
- cron/run-all → GET
- social-card/ → GET

- contact/ → POST (contact form submission) and OPTIONS (CORS pre-flight)
- downloads/submit → POST
- gdpr/consent → POST, GET, DELETE
- gdpr/request-data → POST
- gdpr/export → GET
- gdpr/verify → GET
- health/ → GET
- newsletter/ → POST, OPTIONS
- newsletter/confirm → GET

### Files importing from `astro:db`

- _utils/rateLimit.ts
- _utils/rateLimitStore.ts
- cron/cleanup-confirmations.ts
- cron/cleanup-dsar-requests.ts
- gdpr/_utils/consentStore.ts
- gdpr/_utils/dsarStore.ts
- newsletter/_token.ts

### Cross-endpoint dependencies:

gdpr: Mostly self-contained, but `verify.ts` does import `deleteNewsletterConfirmationsByEmail` from `@pages/api/newsletter/_token` (line 15). That's a direct dependency on the newsletter code.

newsletter: `confirm.ts` pulls `markConsentRecordsVerified` from `@pages/api/gdpr/_utils/consentStore` (line 10) to mark double opt-in consent. That's the reciprocal dependency.

Newsletter hits the gdpr consent endpoint using `recordConsent` in `src/pages/api/_logger/index.ts`.

If we want to make it feel less inconsistent, we could either (a) rename `_logger` to something like `_consentClient` so its purpose is clearer, or (b) move to a microservices architecture and expose a protected `/api/gdpr/verify` endpoint and have newsletter call it over HTTP as well - but that would need additional auth to prevent abuse.

**Affected components:**

- CallToAction/Newsletter
- ContactForm

## Mobile Social Shares UI

See the example image in Social Shares. The social shares UI on mobile should be a modal that slides in from the bottom.

## Performance

Implement mitigations in test/e2e/specs/07-performance/PERFORMANCE.md

## Analytics

Vercel Analytics

- Highlighter component
- Social Shares component
- Social Embeds: Track embed interactions
- Cookie Consent
- Download Form component

npm i @vercel/analytics
import Analytics from '@vercel/analytics/astro'
https://vercel.com/docs/analytics/quickstart#add-the-analytics-component-to-your-app

## Themepicker tooltips, extra themes

- Add additional themes
- Add tooltip that makes use of the description field for the theme, explaining what the intent of the theme is

## Sentry feedback, chat bot tying into my phone and email

See note in src/components/scripts/sentry/client.ts - "User Feedback - allow users to report issues"

https://vercel.com/kevin-browns-projects-dd474f73/astro-webstackbuilders-com/ai-gateway

## Uppy file uploads from contact form

docs/CONTACT_FORM.md

Where to upload to?

## Search

Add Upstash Search as a Vercel Marketplace Integration.

Lunr is a JS search library using an inverted index. Client-side search for statically hosted pages.

### [`@jackcarey/astro-lunr`](https://www.npmjs.com/package/@jackcarey/astro-lunr)

### [`@siverv/astro-lunr`](https://www.npmjs.com/package/@siverv/astro-lunr)

## Email Templates

Right now we're using string literals to define HTML email templates for site mails. We should use Nunjucks with the rule-checking for valid CSS in HTML emails like we have in the corporate email footer repo.

## Color vars

brand primary:    #001733
brand secondary:  #0062B6

ring (1px), ring-2, ring-4
accent

text-white, other default Tailwind colors

## Files with Skipped Tests

Blocked Categories (44 tests):

Visual regression testing (18) - Needs Percy/Chromatic
Lighthouse audits (6) - Integration pending
Newsletter double opt-in (6) - Email testing infrastructure
Axe accessibility (2) - axe-core integration

## Axe tags

cat.aria: Rules related to Accessible Rich Internet Applications (ARIA) attributes and roles.
cat.color: Rules related to color contrast and meaning conveyed by color.
cat.controls: Rules for interactive controls, such as form elements and links.
cat.forms: Rules specifically for forms, form fields, and their labels.
cat.keyboard: Rules related to keyboard operability.
cat.links: Rules for links, including their names and destinations.
cat.name-role-value: Rules that check if an element has a name, role, and value that can be correctly interpreted by assistive technologies.
cat.semantics: Rules related to the semantic structure of a document, such as headings and landmarks.
cat.sensory-and-visual-cues: Rules that deal with information conveyed by sensory or visual characteristics.
cat.structure: Rules related to the document's overall structure, like the proper nesting of elements.
cat.tables: Rules for data tables, including headers and associations.
cat.text-alternatives: Rules for ensuring that text alternatives are provided for non-text content, such as images.

## Set up webmentions

Needs to add real API key and test

- Get API token from webmention.io
- Add WEBMENTION_IO_TOKEN to .env
- (Optional) Set up Bridgy for social media
- Test with sample webmentions

## Custom Directives

[`astro-directives`](https://github.com/QuentinDutot/astro-directives)

```react
<Component client:hover />
```

| Attribute     | Load the javascript and hydrate on ... |
| ------------- | -------------------------------------- |
| client:click  | element click event                    |
| client:hover  | element mouseover event                |
| client:scroll | window scroll event                    |

## Prefetch Links

The default prefetch strategy when adding the data-astro-prefetch attribute is hover. To change it, you can configure prefetch.defaultStrategy in your astro.config.mjs file.

hover (default): Prefetch when you hover over or focus on the link.
tap: Prefetch just before you click on the link.
viewport: Prefetch as the links enter the viewport.
load: Prefetch all links on the page after the page is loaded.

```html
<a href="/about" data-astro-prefetch>
<a href="/about" data-astro-prefetch="tap">About</a>
```

If you want to prefetch all links, including those without the data-astro-prefetch attribute, you can set prefetch.prefetchAll to true:

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'

export default defineConfig({
  prefetch: {
    prefetchAll: true
  }
})
```

You can then opt-out of prefetching for individual links by setting data-astro-prefetch="false":

```html
<a href="/about" data-astro-prefetch="false">About</a>
```

## Astro Components to Add

### "Add to Calendar" button

Google Calendar, Apple Calendar,  Yahoo Calender,  Microsoft 365, Outlook, and Teams, and generate iCal/ics files (for all other calendars and cases).

`https://github.com/add2cal/add-to-calendar-button`
`https://add-to-calendar-button.com/`

### Astro wrapper for the `@github/clipboard-copy-element` web component. Copies element text content or input values to the clipboard

[`clipboard-copy`](https://github.com/BryceRussell/astro-github-elements/tree/main/packages/clipboard-copy#astro-github-elementsclipboard-copy)

### Astro wrapper for GitHub's relative time web component. Translates dates to past or future time phrases, like "*4 hours from now*" or "*20 days ago*"

[Relative Time](https://github.com/BryceRussell/astro-github-elements/tree/main/packages/time#readme)

### Display text in a circular layout

[TextCircle](https://github.com/LoStisWorld/astro-textcircle#astro-textcircle)

## Markdown

## Code Block and Highlighting

## Astro includes shiki, tweak config

### Custom version of the code block integration from Astro Docs. "Beautiful code blocks for your Astro site". Applied to the code blocks created in `.mdx` files

[`astro-code-blocks`](https://www.npmjs.com/package/@thewebforge/astro-code-blocks)


#### Code tabs plugin so Javascript and Typescript examples can both be show.

There can only be white space between two code blocks. Display name is set by `tabName` and can only contain characters in [A-Za-z0-9_]. Syntax for the first line of the code block is:

```js [group:tabName]
```

`markdown-it-codetabs`

#### Add copy button to code blocks

`markdown-it-copy`

Options for "copy" button added to code blocks

```javascript
const markdownCodeCopyConfig = {
  /** Text shown on copy button */
  btnText: `Copy`,
  /** Text shown on copy failure */
  failText: `Copy Failed`,
  /** Text shown on copy success */
  successText: `Success!`, // 'copy success' | copy-success text
  /** Amount of time to show success message */
  successTextDelay: 2000,
  /** An HTML fragment included before <button> */
  extraHtmlBeforeBtn: ``,
  /** An HTML fragment included after <button> */
  extraHtmlAfterBtn: ``,
  /** Whether to show code language before the copy button */
  showCodeLanguage: false,
  /** Test to append after the copied text like a copyright notice */
  attachText: ``,
}
```

Right now, we are doing CI on GitHub for the project and CD on Vercel. We are running "npm run build" on GitHub just to smoke screen that the build runs green, but the actual preview and production builds occur on Vercel.

The smoke build runs successfully on GitHub after adding a step to install system dependencies for Chromium browser (required by our recent work to add Mermaid). But it fails on Vercel, adding it to the "build" command in Vercel's UI, because Vercel uses a minimal distro image that does not have apt installed. There is no option for using a custom build image on Vercel.

We need to do the following, and move the build entirely onto GitHub:

1. Cache the build artifacts generated in the "lint" job in test.yml workflow
2.

https://github.com/webstackdev/astro.webstackbuilders.com/actions/runs/20321382632

Issue of preview vs. production database access

Need three environments on GitHub: testing, preview, production

Need two environments on Vercel: preview, production

Name            Branch Tracking                 Domains
Production      No branch configuration         astro-webstackbuilders-com.vercel.app
Preview         All unassigned git branches     No custom domains
Development     Accessible via CLI              No custom domains

```bash
--target=production
--target=preview
--target=development
```

Need to remove all logic that's testing whether we're on GitHub or Vercel and use environment
Need to make sure that all logic doing that locally is using the "testing" setting. Is there a difference between "development" and "testing" for local work?

### How to get the Vercel CLI to authenticate in CI

```bash
# Build the project locally
NODE_ENV=development npx vercel build --target=preview --token my-secret-access-token --yes

# Deploy the pre-built project, archiving it as a .tgz file
vercel deploy --prebuilt --target=preview --archive=tgz --token my-secret-access-token --yes
```

```bash
# Build the project locally
NODE_ENV=production npx vercel build --target=production --token my-secret-access-token --yes

# Deploy the pre-built project, archiving it as a .tgz file
vercel deploy --prebuilt --target=production --archive=tgz --token my-secret-access-token --yes
```

### Targeting default production environment on Vercel

The `--prod` option can be used to create a deployment for a production domain specified in the Vercel project dashboard.

`vercel deploy --prebuilt --prod`

The `--no-wait` option does not wait for a deployment to finish before exiting from the deploy command. Currently about 18s to extract archive.

### Vercel CLI

Do we need to `npm i -g vercel@latest` in Action instead of installing vercel as a package and using npx?

### Getting domain URL and errors

```bash
# save stdout and stderr to files
vercel deploy >deployment-url.txt 2>error.txt

# check the exit code
code=$?
if [ $code -eq 0 ]; then
    # Now you can use the deployment url from stdout for the next step of your workflow
    deploymentUrl=`cat deployment-url.txt`
    vercel alias $deploymentUrl my-custom-domain.com
else
    # Handle the error
    errorMessage=`cat error.txt`
    echo "There was an error: $errorMessage"
fi
```

Vercel isn't calling back to GitHub in this setup — GitHub Actions is.

`deployment.yml` runs after the Test workflow completes (`on: workflow_run`).

The deploy itself is kicked off by GitHub Actions via `amondnet/vercel-action@v41.1.4` (it runs the Vercel CLI using your `VERCEL_TOKEN`).

After that, the workflow updates GitHub using the GitHub API with `GITHUB_TOKEN`:

- `publish-preview-status` uses `checks: write` and upserts a check run named `Deploy Preview` to Vercel by calling `POST /repos/{owner}/{repo}/check-runs or PATCH /repos/{owner}/{repo}/check-runs/{id}`.

The PR preview URL/failure messaging is posted by your local comment actions (`deploy-preview-success-comment`, `deploy-preview-failure-comment`), also from GitHub Actions — not from a Vercel webhook.

### One or Two Files for Push Turso Migrations

@TODO: Need to add a workflow check to make sure database migrations successfully publish

You can do either, but I'd pick based on what you want the "unit of trust" to be.

**One file (`push-turso-migrations.yml`) with two jobs (`preview` + `production`)**

- Pros: one place to maintain; shared steps stay identical; easier to keep logic in sync.

- Cons: more conditional logic (if: branching) and it's easier to accidentally run the wrong env's migration if a condition is off; harder to reason about from the Actions UI because both concerns live together.

**Two files (`push-turso-preview-migrations.yml` + `push-turso-production-migrations.yml`)** — my recommendation

- Pros: least ambiguity; each workflow can have minimal permissions/secrets; clearer UI/history (`Preview migrations` vs `Production migrations`); easier to gate production harder (manual approval, environment protection, branch rules) without touching preview.

- Cons: some duplication (though you can mitigate with a reusable workflow `workflow_call` later if you want).

**Recommendation**

Given your requirement ("same workflow but different env var at two different points") and that this runs before two different deployment paths, separating them usually reduces risk and makes auditing simpler.

**Two quick clarifiers**

- Are preview deployments triggered only for PRs (via `workflow_run` in `deployment.yml`) and production only on main pushes?

- Do both preview/prod migrations use the same Turso DB but different environments, or are they actually different databases (different tokens/URLs)?

### Gating on "Merge" button pushed on GitHub

Not exactly "after clicking Merge, decide whether to finish the merge" — GitHub doesn't let an arbitrary workflow run *after* the merge button is pressed and then retroactively block/allow that same merge. The gating point is *before* the merge is allowed.

What you can do instead (the usual patterns):

- **Branch protection + required checks (recommended)**

  - Configure `main` branch protection to require specific status checks to pass.
  - Those checks come from workflows triggered on `pull_request` (or `merge_group` if you use merge queue).
  - Result: the Merge button is disabled until checks pass; if checks fail, merge is blocked and the UI shows why.

- **Merge queue ("merge_group") for stricter gating**

  - If you enable GitHub's merge queue, GitHub creates a temporary merge commit and runs workflows on `merge_group`.
  - Only if they pass does GitHub merge to `main`. This is the closest to "I clicked merge and it runs checks on the exact merge result".

- **Post-merge workflows can only react, not block**

  - Workflows triggered by `push` to `main` (i.e., after merge) can deploy, run migrations, etc., but they can't stop the merge that already happened. They can only report failure and/or roll back.

- **Programmatic merges**

  - If you merge via API/CLI, you *can* implement your own "run workflow → only merge if success" logic in your tooling, but GitHub's UI merge button won't do that by itself.

If you tell me whether you're using **branch protection only** or **merge queue**, and what the "must-pass" workflow is (tests, turso migrations, deploy preview), I can suggest the cleanest trigger (`pull_request` vs `merge_group`) and how to wire required checks so merges are blocked appropriately.

### Merge Group Checks

Yep — we can publish a custom Check Run that only exists for `merge_group` events, the same way `publish-preview-status` upserts `Deploy Preview to Vercel`.

Plan:

- Inspect whether you already have any `merge_group` workflow today.
- Add a new local action (modeled on `publish-preview-status`) that refuses to run unless `GITHUB_EVENT_NAME === 'merge_group'`, and upserts a check run on `GITHUB_SHA`.

### How GitHub Names Jobs in the Checks Dialog on a PR

#### Checks produced by GitHub Actions workflow jobs

These are named from your workflow YAML:

1. Workflow name = top-level name: in the workflow file

- `test.yml` has name: Test
- `branch-protection.yml` has name: `Branch Protection`
- `codeql.yml` has name: `CodeQL Advanced Security Scanning`
- `dependency-review.yml` has name: `Dependency Review`

2. Job name = jobs.<jobId>.name (if omitted, GitHub falls back to the job id)

- `test.yml`: name: `Lint`, name: `Unit Tests`, name: `E2E Tests`

In the merge box / "Some checks were not successful" widget, GitHub typically renders these as:

`<workflow name> / <job name> (<event>)`

That's why you see things like:

- `Test / E2E Tests (pull_request)`
- `Branch Protection / Validate Branch Name (pull_request)`
- `CodeQL Advanced Security Scanning / Analyze Code (javascript) (pull_request)`

In the older "Checks" list view (like your closed PR example), GitHub often shows just the job name ("Lint", "Unit Tests", etc.) with `@github-actions[bot]`, which is why the format looks different even when nothing was renamed.

2) Checks created via the GitHub Checks API (not a workflow job)

These are "check runs" created/updated by an app calling the API. The display name is whatever the API call sets as `check_run.name`.

Your local action `publish-preview-status` explicitly creates/updates a check run with:

`const checkName = 'Deploy Preview to Vercel'`

So that check's name is "Deploy Preview to Vercel", regardless of workflow/job names, because it's not a job check at all.

3) App-provided checks (Code scanning / GitGuardian)

Examples:

- `Code scanning results / CodeQL` is produced by GitHub's code scanning app (not your job name).
- `GitGuardian Security Checks` is produced by GitGuardian's GitHub app.

Those names are determined by the app, not by your workflow/job names.

Why you're seeing "skipped" with a weird prefix

If you see something like `CodeQL Advanced Security Scanning / Deploy Preview to Vercel (pull_request)` in the "skipped checks" section, that string is in the Actions-style workflow/job format (GitHub's `<check suite> / <check run>` display format) - meaning GitHub is treating it like a required workflow job check context, not your API-created "Deploy Preview to Vercel" check run. That usually happens when branch protection is configured to require a check whose context includes a workflow name/job name (and that exact context doesn't get produced on this PR, so it shows as skipped).

Q: Can a job be a required check?

A: Yes. A GitHub Actions job produces a check run. Requiring that check in a ruleset is the normal pattern.

The PR "Checks" UI is primarily showing checks produced by workflows that ran on the PR event (e.g. `pull_request`, and `merge_group` if you use merge queue). A `workflow_run` workflow's jobs typically don't appear there as "PR checks" in the same way.

Your publish-preview-status action avoids creating repeated ones by "upserting". It lists check runs on the `SHA`. If it finds one named `Deploy Preview to Vercel`, it updates it; otherwise it creates it.

If you want to make this less confusing in the UI, the usual trick is to give the API-created check a distinct name (e.g. `Preview Deploy Gate`)

#### Bypass Jobs

Right now the "hotfix bypass" is implemented purely inside Test (test.yml) by skipping the real jobs (lint, unit-test, e2e-test) when the branch starts with hotfix/, and instead running a trivial hotfix-bypass job that always succeeds.

How gating actually works (important bit)

- Branch protection / rulesets don't understand your intent ("hotfix should bypass").

- They only look at required check names and whether each required check produced a successful conclusion on the PR's latest commit.

- If a workflow/job is skipped, GitHub usually reports it as skipped/neutral, which will still block merge if that check name is required.

So if you want "Dependency Review" and "CodeQL" to be required on main, and you want hotfix PRs to bypass them, you must ensure that for hotfix PRs there is still a successful check run with the same required name.

Two workable patterns (pick one)

1. Keep everything in each workflow (simplest)

- Add if: !startsWith(..., 'hotfix/') to the real job(s)
- Add a hotfix-bypass job in the same workflow whose job name: exactly matches the required check name (e.g., Review Dependencies, CodeQL)
- Result: ruleset sees the required check names, and they pass on hotfix PRs.

2. Create a separate bypass.yml (cleaner reuse, but slightly trickier)

- You can create .github/workflows/bypass.yml that runs on pull_request and emits "bypass" jobs.
- But the required checks must match the job names from bypass.yml, not the ones from the original workflows—unless you keep the required check names identical. That means coordinating names very carefully, or you'll end up with duplicates / still-blocking checks.

### Untrusted Checkout Issues

#### Difficulties with dual checkout / artifact-based deploy

Difficulty involved in moving preview deployments off `workflow_run` PR head execution (dual-checkout / working-directory or artifact-based deploy):

1. **Low difficulty (likely smooth)**

- When the deploy tool supports a working-directory input (like `amondnet/vercel-action` does), and your repo doesn't rely on weird relative paths.

- You can do:

  - trusted checkout to get your local actions + pinned deps
  - untrusted checkout into `./workspace/`
  - run the deploy action with working-directory: `./workspace`

2. Moderate difficulty (most common bumps)

- **Anything that assumes repo-root paths, like:**

  - `vercel.json` referencing files via relative paths
  - build commands that expect `src` at root
  - scripts that read files by relative path (e.g., `package.json`)

- Fix is usually straightforward: set `working-directory` (`cwd`) consistently and make sure any path inputs are relative to that directory.

3. **Higher difficulty (more debugging risk)**

- If you need to run "repo tools" (node / python installs, build steps) across both trees and you accidentally:

  - install deps from the untrusted checkout (reintroducing the issue)
  - mix artifacts between trees (e.g., `node_modules` in the wrong place)
  - Or if you use actions / tools that don't let you specify `working-directory`, forcing `cd`-style shell steps and careful path management.

4. **Practical expectation**

- For your case (Vercel deploy via `amondnet/vercel-action`), the presence of `working-directory` makes it much less risky.

- The main debugging you'd likely do is ensuring Vercel sees the correct project root and build config under the untrusted checkout directory.

If you want, I can sketch a minimal "dual checkout" snippet tailored to your existing deploy-preview job and point out exactly which steps must run in the trusted tree vs the untrusted tree.

### Trust in workflow triggers

1. `on: push` isn't "untrusted" the same way a PR is

A workflow that runs on push runs on commits that land on branches you specify (in your `Test` workflow, only `main`). For someone to trigger it, they need permission to push to `main` (or be a maintainer merging a PR). At that point, they effectively already have high trust in the repo.


You can't retroactively stop a push that already happened; post-merge deploy failure means main is already updated.

The controls you have are:

- Prevent merging unless pre-merge checks pass (build/test, maybe a dry run deploy, or smoke test against a staging/preview).
- Make production deploy safe/atomic (or rollback) so a failed deploy doesn't break prod.
- If you truly need merge only if production deploy succeeds, you need a pre-merge mechanism (merge queue/merge_group with a deploy-like validation, or a protected promote step gated by approvals).

If you tell me whether you want (a) prod deploy auto on merge, (b) prod deploy requires approval, or (c) merge should be gated on a pre-prod deploy check, I can recommend the cleanest workflow layout for your merge-group plans.

#nforce gates before the deploy job runs:

Yes - your understanding is accurate if you mean "deploy happens outside GitHub when main updates".

Environment protections (approvals/wait timers/branch restrictions) gate jobs that target an `environment:`. They pause that job before its steps execute.

If there is no deploy job in GitHub (because a third-party watches main and deploys), GitHub can't gate that external deploy unless you add a GitHub job that either (a) performs the deploy, or (b) triggers/controls the third-party deploy, or (c) at least records/monitors it.
Merges are blocked only by branch protection (required checks/reviews/rules). So a "deploy job" only affects merging if you make it a required check (or otherwise integrate it into the required checks flow).
