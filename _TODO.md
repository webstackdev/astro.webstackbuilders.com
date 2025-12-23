<!-- markdownlint-disable-file -->
# TODO

## Astro Actions - Action / Domain / Responder Pattern

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

## Refactor Theme Colors

### Color vars

brand primary:    #001733
brand secondary:  #0062B6

ring (1px), ring-2, ring-4
accent

text-white, other default Tailwind colors

## Refactor E2E Test Suite

### Files with Skipped Tests

Blocked Categories (44 tests):

Visual regression testing (18) - Needs Percy/Chromatic
Lighthouse audits (6) - Integration pending
Newsletter double opt-in (6) - Email testing infrastructure
Axe accessibility (2) - axe-core integration

### Axe tags

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

## Performance

Implement mitigations in test/e2e/specs/07-performance/PERFORMANCE.md

## Email Templates

Right now we're using string literals to define HTML email templates for site mails. We should use Nunjucks with the rule-checking for valid CSS in HTML emails like we have in the corporate email footer repo.

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

## Set up webmentions

Needs to add real API key and test

- Get API token from webmention.io
- Add WEBMENTION_IO_TOKEN to .env
- (Optional) Set up Bridgy for social media
- Test with sample webmentions

## Mobile Social Shares UI

See the example image in Social Shares. The social shares UI on mobile should be a modal that slides in from the bottom.

## Sentry feedback, chat bot tying into my phone and email

See note in src/components/scripts/sentry/client.ts - "User Feedback - allow users to report issues"

https://vercel.com/kevin-browns-projects-dd474f73/astro-webstackbuilders-com/ai-gateway

## Uppy file uploads from contact form

docs/CONTACT_FORM.md

Where to upload to?

## Search

Add Upstash Search as a Vercel Marketplace Integration.

### "Add to Calendar" button

Google Calendar, Apple Calendar,  Microsoft Outlook and Teams, and generate iCal/ics files (for all other calendars and cases).

## Troubleshooting deploy workflow issues

`https://github.com/add2cal/add-to-calendar-button`
`https://add-to-calendar-button.com/`

Here are the most plausible causes, ranked, with evidence from your repo:

1. Composite action inputs aren't being exported to `INPUT_*` for `run:` steps (so `actions_toolkit` can't read them)

- Your passing action `check-prerequisites-and-locate-build-artifact` manually exports inputs into env: (e.g. `INPUT_GITHUB_TOKEN: ${{ inputs.github-token }}`).

- The failing action `download-build-artifact` (and also `create-github-deployment-preview`, `mark-deployment-in-progress`, `update-deployment-status`) does not export any `INPUT_*` env vars.

- If the runner doesn't auto-populate `INPUT_*` for composite `run:` steps (or changed behavior), then `core.get_input(...)` will think the input is missing and throw exactly what you're seeing.

2. `actions_toolkit` is looking for `INPUT_GITHUB_TOKEN` (underscore), but only `INPUT_GITHUB-TOKEN` (dash) exists (or vice versa)

- The fact that action.yml explicitly sets `INPUT_GITHUB_TOKEN` is a big hint that at least one of your toolchains expects the underscore variant.

- If the runner provides only the dashed form but the toolkit reads only the underscored form (or the opposite), you'll get "Input required and not supplied" even though the workflow shows the with: value.

3. The deploy workflow is executing main's actions, not the branch you think you fixed

- `deployment-preview.yml` checks out ref: main. For a `workflow_run` trigger, that makes it easy to end up running local actions from main even if you "fixed it" elsewhere previously.

- Symptom: you "keep fixing" but the preview run keeps behaving like an older version.

4. The `"with: github-token: ***"` line can be misleading if the expression resolves empty

- `github.token` should exist, but edge cases (permissions mis-specified, workflow context differences, or job-level permission not applied the way you expect for `workflow_run`) can produce a token that's unusable or empty.

- This would be rarer than (1)/(2), but it still manifests as "required input missing".

5. The error text is from the library's normalization, not a literal requested key

- You don't have any repo code that calls `get_input("GITHUB-TOKEN")` literally; everything calls `get_input_compat("github-token", required=True)`.

- Many toolkits uppercase / normalize the input name when reporting it, so `GITHUB-TOKEN` in the error can still correspond to `github-token` as defined.

If you want a single "most likely" call: based on the repo evidence, (1) is the top suspect — it explains why the prereq action works (it exports env) and the next composite Python action fails (it doesn't).


