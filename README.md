# Astro Starter Kit: Basics

@TODO: See NOTES.md, this file is split between here and there. Consider using Nightwatch instead of Playwright for e2e testing.

@TODO: See here for utility components like shortcodes: <https://docs.astro.build/en/reference/api-reference/#astroslotsrender>

## Contributing & Git Workflow

This repository uses branch protection and automated quality checks. See [docs/GIT_WORKFLOW.md](./docs/GIT_WORKFLOW.md) for complete details.

**Quick Start:**

```bash
# Create a feature branch (required - cannot commit to main)
git checkout -b feature/your-feature-name

# Make changes and commit (hooks will run automatically)
git commit -m "Your message"

# Push and create a Pull Request
git push -u origin feature/your-feature-name
```

**Branch Naming:**

- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `infrastructure/*` - DevOps/CI/CD changes
- `maintenance/*` - Dependency updates, refactoring
- `content/*` - Content updates

**Pre-commit Checks:**

- Unit tests must pass
- Branch name must follow conventions
- Cannot commit directly to main

### Local Development Server

Use the helper script below to start Astro with `.env.development` automatically loaded:

```bash
npm run dev:env
```

The underlying `npm run dev` command remains unchanged for CI and Vercel; `dev:env` is just a convenience for local shells so API routes that depend on `process.env` (cron handlers, email providers, etc.) behave the same way they do in production.

## Supabase Production Initialization

Provisioning the hosted Supabase project uses the same SQL migrations that back local development. When you need to initialize (or update) the production database:

1. Authenticate the Supabase CLI (only required once per machine):

  ```bash
  npx supabase login
  ```

1. Link the CLI to the production project (replace the placeholder reference):

  ```bash
  npx supabase link --project-ref your-production-project-ref --workdir suprabase
  ```

1. Apply the latest migrations and RLS policies:

  ```bash
  npm run supabase:db:push
  ```

The `supabase:db:push` script runs `supabase db push` against the linked project, ensuring every table, index, and policy in `suprabase/migrations` is kept in sync with production.

## Astro DB Workflows

Astro DB schemas now live under `db/config.ts`. Applying those migrations requires `npx astro db push`; the regular `astro build` command never pushes schema changes for you. Keep local and remote pushes separate to avoid promoting unfinished changes:

- **Local development / CI** – Point Astro DB at the file-based database via `ASTRO_DB_REMOTE_URL="file:./db/dev.db"` and run `npx astro db push`. For convenience the `build:ci` script exports `ASTRO_DATABASE_FILE=./db/dev.db` before invoking `astro build`, so `npm run build:ci` is the go-to command anywhere you need a build that reads the local snapshot (including GitHub Actions).
- **Production Turso push** – Export your Turso connection details (`ASTRO_DB_REMOTE_URL` + `ASTRO_DB_APP_TOKEN`) and run `npx astro db push --remote`. The merge-to-main workflow should be the only automation that executes this command.
- **Vercel deployments** – Set the build command to `npm run build -- --remote` so the build pipeline talks to Turso in read-only mode while still leaving schema promotion to the dedicated workflow.

> `ASTRO_DATABASE_FILE` is evaluated before Astro loads `.env.*`, so put it directly in the shell invocation (e.g., `ASTRO_DATABASE_FILE=./db/dev.db npm run build`) or reuse the provided `npm run build:ci` helper. Dropping the variable into `.env.development` or `.env.production` will not satisfy the build hook.

### Build scripts

- `npm run build` – Runs `astro build --remote`, hitting the production Turso database in read-only mode. Use this for Vercel deployments and any workflows that need to mirror production infrastructure.
- `npm run build:ci` – Exports `ASTRO_DATABASE_FILE=./db/dev.db` before delegating to `npm run build`, forcing the build to read from the local SQLite snapshot. Use this for local testing and the `Test` GitHub workflow so schema changes stay isolated until the Turso push workflow runs.

## Coding Standards

### Component Architecture

**Script Organization:**

- Layouts (`src/layouts`) and pages (`src/pages`) must not contain `<script>` tags
- Components must use `client.ts` for client-side code and `server.ts` for build-time code
- Helper files in component folders must only be imported via `server.ts` or `client.ts`
- The `src/lib` directory is exclusively for server-side code

**Client-Side Execution:**

- All client scripts must use the LoadableScript pattern and register with the loader system
- No direct event listeners or immediate script execution in component templates
- Component `<script>` tags should only import `client.ts` and call `registerScript()`

**Build-Time Code:**

- `server.ts` files contain functions used during the build process
- Imports from `src/lib/helpers` are allowed in frontmatter
- Node modules can be imported for build-time operations

**Exception:** The inline theme script in `src/components/Head/index.astro` intentionally violates these rules to prevent flash of unstyled content (FOUS).

## MDX Components

The project includes custom components that can be used in MDX files for enhanced content:

### Newsletter Signup Component

Use the `<Signup>` component to add a newsletter signup form to your MDX content:

```mdx
<Signup
  title="Stay Updated"
  description="Get the latest articles and insights delivered to your inbox."
  buttonText="Subscribe"
  placeholder="Enter your email"
/>
```

**Props:**

- `title` (optional): Heading text for the signup form (default: "Newsletter Signup")
- `description` (optional): Description text below the title (default: "Subscribe to get the latest updates and insights.")
- `buttonText` (optional): Text for the submit button (default: "Subscribe")
- `placeholder` (optional): Placeholder text for the email input (default: "Enter your email address")
- `className` (optional): Additional CSS classes to apply

### Tweet Embed Component

Use the `<X>` component to embed tweets in your MDX content:

```mdx
<X
  id="1234567890123456789"
  author="username"
  content="This is the tweet content..."
  date="2024-01-15"
  avatar="/path/to/avatar.jpg"
/>
```

**Props:**

- `id` (required): The tweet ID from the Twitter/X URL
- `author` (optional): Twitter username (default: "Twitter User")
- `content` (optional): Tweet text content (default: "Loading tweet...")
- `date` (optional): Tweet date in YYYY-MM-DD format (default: current date)
- `avatar` (optional): URL to user's avatar image (default: "/assets/images/default-avatar.png")
- `className` (optional): Additional CSS classes to apply

**Note:** To use these components in MDX files, make sure to import them at the top of your MDX file:

```mdx
---
# Your frontmatter here
---

import Signup from '../components/Newsletter/Signup.astro';
import X from '../components/Tweet/index.astro';

# Your Content

<Signup title="Join Our Newsletter" />

<X id="1234567890123456789" author="example" content="Check out this amazing post!" />
```

## Theme System

The project uses a modern CSS custom properties-based theme system that supports light and dark themes, with extensibility for additional themes like seasonal variations.

### Architecture

The theme system consists of two main files that must be kept in sync:

1. **`src/styles/themes.css`** - Pure CSS file containing all theme definitions using CSS custom properties
2. **`src/lib/themes.ts`** - TypeScript registry defining available themes for the theme picker component

### Adding a New Theme

To add a new theme (e.g., a holiday theme), follow these steps:

#### 1. Add CSS Variables in `src/styles/themes.css`

Add a new CSS rule with the theme's custom colors following the pattern of existing themes in this file.

#### 2. Register Theme in `src/lib/themes.ts`

Add your theme to the themes array:

```javascript
export const themes = [
  {
    id: 'default',
    name: 'Light',
    description: 'Clean light theme with blue accents',
    category: 'core'
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark theme with navy background',
    category: 'core'
  },
  {
    id: 'holiday',
    name: 'Holiday',
    description: 'Festive red and green theme for the holidays',
    category: 'seasonal',
    seasonal: true
  }
];
```

#### 3. Theme Properties

Each theme object supports these properties:

- **`id`** (required): Unique identifier used in the `data-theme` attribute
- **`name`** (required): Display name shown in the theme picker
- **`description`** (optional): Tooltip description for the theme
- **`category`** (optional): Used for grouping themes ('core', 'seasonal', etc.)
- **`seasonal`** (optional): Boolean flag marking temporary/seasonal themes

### CSS Variable Reference

The theme system provides these CSS custom properties:

#### Core Variables

- `--color-bg` / `--color-bg-offset` - Background colors
- `--color-text` / `--color-text-offset` - Text colors
- `--color-border` - Border color

#### Brand Variables

- `--color-primary` / `--color-primary-offset` - Primary brand colors
- `--color-secondary` / `--color-secondary-offset` - Secondary colors

#### Status Variables

- `--color-success` / `--color-danger` / `--color-warning` / `--color-info` - Status colors
- Background variants available with `-bg` suffix

#### Special Variables

- `--color-accent` - Purple accent color for highlights
- `--color-twitter` - Twitter brand color
- `--color-modal-background` - Modal overlay background
- `--shiki-theme` - Syntax highlighting theme name

### Theme Switching

Themes are applied by setting the `data-theme` attribute on the document element:

```javascript
document.documentElement.setAttribute('data-theme', 'holiday');
```

The system also respects the user's system preference with `@media (prefers-color-scheme: dark)` for users who haven't explicitly chosen a theme.

## Markdown Content Styling

The project uses a Rehype plugin (`src/lib/markdown/rehype-tailwind-classes.ts`) to automatically apply Tailwind CSS classes to rendered Markdown content. This replaces the previous SCSS-based content styling system.

### Supported Markdown Elements

All standard Markdown elements are automatically styled with appropriate Tailwind classes:

- **Paragraphs**: Proper spacing, readable font size, and line height
- **Headings**: Typography hierarchy with serif fonts for h1-h3
- **Links**: Underline effects with hover states
- **Images/Videos**: Responsive sizing, centering, and shadows
- **Lists**: Proper indentation and spacing
- **Code**: Inline code highlighting and block code formatting
- **Tables**: Full styling with borders and hover effects
- **Blockquotes**: Left border accent with serif typography

### Vendor Plugin Support

The Rehype plugin also handles specialized Markdown-it plugins:

#### Code Tabs (`code-tabs`)

For tabbed code blocks created by markdown-it plugins:

```markdown
<!-- This would be processed by a markdown-it plugin -->
::: code-tabs
@tab JavaScript

```js
console.log('Hello, World!')
```

@tab TypeScript

```ts
const message: string = 'Hello, World!'
console.log(message)
```

:::

**Auto-applied classes**: Tab navigation, content panels, active states

#### Expandable Details (`<details>`)

For collapsible content sections:

```markdown
<details>
<summary>Click to expand</summary>

This content will be collapsible with proper styling.

</details>
```

**Auto-applied classes**: Cursor pointer, remove default markers, content indentation

#### Named Code Blocks

For code blocks with filename labels:

````markdown
```js filename="example.js"
const example = true
```
````

**Auto-applied classes**: Filename positioning, background styling, opacity effects

#### Share Highlight (`<share-highlight>`)

For text selection sharing functionality:

```html
<share-highlight>
Select this text to see sharing options
</share-highlight>
```

**Auto-applied classes**: CSS custom properties for theming and interaction states

### Migration from SCSS

This system replaces the previous `_content.css` and vendor SCSS files:

- `src/styles/vendor/_codetab.css` → Integrated into Rehype plugin
- `src/styles/vendor/_expandable.css` → Integrated into Rehype plugin
- `src/styles/vendor/_namedCodeBlock.css` → Integrated into Rehype plugin
- `src/styles/vendor/_shareHighlight.css` → Integrated into Rehype plugin

The styling is now applied automatically to all rendered Markdown content without needing to import or reference any CSS classes.

## CSS Fixes

- Make sure a fixed height header doesn't cover title text on page navigation

```css
h2:target {
  scroll-margin-top: var(--header-height);
}

:is(h2, h3, h4):target {
  scroll-margin-top: var(--header-height);
}
```

Also, we can play around with units like ex, or lh for dynamic spacing:

```css
:target {
  scroll-margin-top: calc(var(--header-height) + 1lh);
}
```

This way, we get different offset based on the line-height of the target element which makes our spacing more dynamic.

- Balance text in titles that span multiple lines

```css
h2 {
  text-wrap: balance;
}
```

- Match scroll bar color to page dark/light theme

Usually, websites switch between dark and light themes by assigning a class like dark or light to the body of the document. However, in our case, fixing the scrollbar requires applying the color-scheme property directly to the root element. Can we tackle this with CSS alone? Enter the `:has()` selector.

```css
:root:has(body.dark) {
  color-scheme: dark;
}
```

## See An Error

losst.pro has a modal that pops up for fixing mistakes:

*Found a mistake in the text? Let me know about that. Highlight the text with the mistake and press Ctrl+Enter.*

## Astro Plugins

- astro-auto-import
- astro-navigation
- astro-webfinger (Mastodon)

## Icons

Icons are managed through the `astro-icon` system with SVG files stored in `src/icons/`.

**Adding a new icon:**

See [docs](src/icons/README.md).

**Usage:**

```typescript
---
 import Icon from 'components/Icon.astro'
---
<Icon name="fileName" class="customClassName"/>
```

## Pages

Any `.astro`, `.md`, or `.mdx` file anywhere within the `src/pages/` folder automatically became a page on your site.

## Navigation

Astro uses standard HTML anchor elements to navigate between pages (also called routes), with traditional page refreshes.

```astro
<a href="/">Home</a>
```

## Layouts

The `<slot>` element in an included layout will render any child elements between the `<Layout>` element used in pages

## Get Markdown Frontmatter in a Layout

```astro
---
const { frontmatter } = Astro.props;
---
<h1>{frontmatter.title}</h1>
<p>Published on: {frontmatter.pubDate.slice(0,10)}</p>
```

## Globbing

`src/pages/blog.astro`

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import BlogPost from '../components/BlogPost.astro';
const allPosts = Object.values(import.meta.glob('../pages/posts/*.md', { eager: true }));
const pageTitle = "My Astro Learning Blog"
---
<BaseLayout pageTitle={pageTitle}>
  <ul>
    {allPosts.map((post) => <BlogPost url={post.url} title={post.frontmatter.title} />)}
  </ul>
</BaseLayout>
```

`src/components/BlogPost.astro`

```astro
---
const { title, url } = Astro.props
---
<li><a href={url}>{title}</a></li>
```

## Collections

Use `getCollection` instead of a glob. Frontmatter is returned on the `data` key.

```astro
---
import { getCollection } from "astro:content";

const allPosts = await getCollection("posts");
---
<BlogPost url={`/posts/${post.slug}/`} title={post.data.title} />
```

## Tags

Each blog post should have a Frontmatter tag item:

`tags: ["blogging"]`

`src/pages/tags/[tag].astro`

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import BlogPost from '../../components/BlogPost.astro';

export async function getStaticPaths() {
  const allPosts = Object.values(import.meta.glob('../posts/*.md', { eager: true }));

  const uniqueTags = [...new Set(allPosts.map((post) => post.frontmatter.tags).flat())];

  return uniqueTags.map((tag) => {
    const filteredPosts = allPosts.filter((post) => post.frontmatter.tags.includes(tag));
    return {
      params: { tag },
      props: { posts: filteredPosts },
    };
  });
}

const { tag } = Astro.params;
const { posts } = Astro.props;
---
<BaseLayout pageTitle={tag}>
  <p>Posts tagged with {tag}</p>
  <ul>
    {posts.map((post) => <BlogPost url={post.url} title={post.frontmatter.title}/>)}
  </ul>
</BaseLayout>
```

## Get the currently focused element on the page in the console

```bash
document.activeElement
```

## Testing HTML with `html-validate` in Braid UI

```typescript
import '@testing-library/jest-dom';
import 'html-validate/jest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BraidTestProvider } from '../../../entries/test';
import { Button, IconSend } from '..';

describe('Button', () => {
  it('should render valid html structure', () => {
    expect(
      renderToStaticMarkup(
        <BraidTestProvider>
          <Button>Button</Button>
          <Button icon={<IconSend />}>Button</Button>
        </BraidTestProvider>,
      ),
    ).toHTMLValidate({
      extends: ['html-validate:recommended'],
    });
  });
});
```

## Run a single test

```bash
clear && TS_NODE_PROJECT="tsconfig.jest.json" yarn jest eleventy/nunjucksAsyncShortcodes/asyncImageHandler/utils.spec.js --projects test/jest/jest.config.node.ts
```

## Testing

The project uses a dual testing setup:

- **Unit Tests**: Vitest for testing individual functions and components
- **E2E Tests**: Playwright for end-to-end browser testing

### Running Tests

**Run all tests (unit + e2e):**

```bash
npm test
```

**Run only unit tests:**

```bash
npm run test:unit
```

**Run only e2e tests:**

```bash
npm run test:e2e
```

**Run tests with coverage report:**

```bash
npm run test:coverage
```

### Code Coverage

The project uses Vitest with the v8 coverage provider to generate comprehensive test coverage reports.

**Viewing Coverage Reports:**

After running `npm run test:coverage`, coverage reports are generated in multiple formats:

1. **Console Output** - Summary displayed in terminal
2. **HTML Report** - Interactive browsable report at `./coverage/index.html`
3. **JSON Report** - Machine-readable at `./coverage/coverage-final.json`
4. **LCOV Report** - Standard format for CI/CD tools at `./coverage/lcov.info`

**To view the HTML coverage report in your browser:**

```bash
# After running coverage
open coverage/index.html        # macOS
xdg-open coverage/index.html    # Linux
start coverage/index.html       # Windows
```

**Coverage Report Locations:**

- All coverage reports are stored in the `./coverage` directory
- The directory is automatically cleaned before each coverage run
- Coverage includes: `src/**/*.{ts,tsx,astro}` and `scripts/**/*.ts`
- Excludes: test files, type definitions, and test directories

**Note:** The `coverage/` directory should be added to `.gitignore` to avoid committing generated reports.

### Unit Test Structure

Unit tests are located alongside their source files:

- `src/**/*.spec.ts` - Component and library tests
- `scripts/**/__tests__/*.spec.ts` - Build script tests

Example test file locations:

- `src/lib/helpers/formatDate.spec.ts`
- `scripts/build/__tests__/favicon.spec.ts`

## Snippet to search for string in project with exclude directories

```bash
clear && egrep -rnw './' --exclude-dir=node_modules --exclude-dir=.yarn --exclude-dir=yarn.lock --exclude-dir=public --exclude-dir=.cache -e 'searchString'
```

## Clear Jest's cache

```bash
npx jest --clearCache
```

## For install errors that report error installing sharp, recommended install. See `jest.setup.jsdom.ts`

```bash
npm install --platform=linux --arch=x64 sharp
```

## Check if a CSS selector is valid in the browser console

```bash
document.querySelector('.contact___callout-flex')
```

## Test the value of a CSS variable when using `calc()` in the browser console

```bash
document.getElementById('header__theme-icon').getBoundingClientRect().width
```
