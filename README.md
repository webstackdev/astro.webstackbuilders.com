# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

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
const allPosts = await Astro.glob('../pages/posts/*.md');
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
  const allPosts = await Astro.glob('../posts/*.md');

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
