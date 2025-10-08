# Astro Starter Kit: Basics

@TODO: See NOTES.md, this file is split between here and there. Consider using Nightwatch instead of Playwright for e2e testing.

@TODO: See here for utility components like shortcodes: https://docs.astro.build/en/reference/api-reference/#astroslotsrender

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
import X from '../components/Tweet/X.astro';

# Your Content

<Signup title="Join Our Newsletter" />

<X id="1234567890123456789" author="example" content="Check out this amazing post!" />
```

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

## Sprites

```typescript
---
 import Sprite from 'components/Sprite.astro'
---
<Sprite name="fileName" class="customClassName"/>
```

## Pages

Any `.astro`, `.md`, or `.mdx` file anywhere within the `src/pages/` folder automatically became a page on your site.

## Navigation

Astro uses standard HTML anchor elements to navigate between pages (also called routes), with traditional page refreshes.

```astro
<a href="/">Home</a>
```

## Layouts

The <slot> element in an included layout will render any child elements between the <Layout> element used in pages

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

## Get the currently focused element on the page in the console:

```bash
document.activeElement
```

## Testing HTML with `html-validate` in Braid UI:

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

## Run a single test:

```bash
clear && TS_NODE_PROJECT="tsconfig.jest.json" yarn jest eleventy/nunjucksAsyncShortcodes/asyncImageHandler/utils.spec.js --projects test/jest/jest.config.node.ts
```

## Snippet to search for string in project with exclude directories:

```bash
clear && egrep -rnw './' --exclude-dir=node_modules --exclude-dir=.yarn --exclude-dir=yarn.lock --exclude-dir=public --exclude-dir=.cache -e 'searchString'
```

## Clear Jest's cache:

```bash
npx jest --clearCache
```

## For install errors that report error installing sharp, recommended install. See `jest.setup.jsdom.ts`:

```bash
npm install --platform=linux --arch=x64 sharp
```

## Check if a CSS selector is valid in the browser console:

```bash
document.querySelector('.contact___callout-flex')
```

## Test the value of a CSS variable when using `calc()` in the browser console:

```bash
document.getElementById('header__theme-icon').getBoundingClientRect().width
```
