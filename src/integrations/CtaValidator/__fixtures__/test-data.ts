/**
 * Test fixtures for CallToAction validator integration tests
 *
 * Provides mock file system structures, component configurations,
 * and test data for comprehensive integration testing.
 */

import { vi } from 'vitest'

// Mock Astro configuration
export const mockAstroConfig = {
  root: new URL('file:///test-project/'),
  srcDir: new URL('file:///test-project/src/'),
  publicDir: new URL('file:///test-project/public/'),
  outDir: new URL('file:///test-project/dist/'),
  cacheDir: new URL('file:///test-project/.astro/'),
  integrations: [],
  adapter: undefined,
  output: 'static' as const,
  server: { host: false, port: 4321, open: false },
  build: { assets: '_astro', assetsPrefix: undefined, format: 'directory' as const },
  base: '/',
  trailingSlash: 'ignore' as const,
  compressHTML: true,
  scopedStyleStrategy: 'attribute' as const,
  vite: {}
}

// Mock logger
export const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
}

// Sample CallToAction components
export const mockCallToActionComponents = [
  {
    name: 'Newsletter',
    path: '/test-project/src/components/CallToAction/Newsletter/index.astro',
    importPatterns: [
      "from '@components/CallToAction/Newsletter/index.astro'",
      "from '@components/CallToAction/Newsletter'",
      "from 'src/components/CallToAction/Newsletter/index.astro'",
      "from 'src/components/CallToAction/Newsletter'",
      "from '../CallToAction/Newsletter/index.astro'",
      "from '../CallToAction/Newsletter'",
      "from './CallToAction/Newsletter/index.astro'",
      "from './CallToAction/Newsletter'",
      '<Newsletter',
      '<Newsletter/>',
      '<Newsletter '
    ]
  },
  {
    name: 'Contact',
    path: '/test-project/src/components/CallToAction/Contact/index.astro',
    importPatterns: [
      "from '@components/CallToAction/Contact/index.astro'",
      "from '@components/CallToAction/Contact'",
      "from 'src/components/CallToAction/Contact/index.astro'",
      "from 'src/components/CallToAction/Contact'",
      "from '../CallToAction/Contact/index.astro'",
      "from '../CallToAction/Contact'",
      "from './CallToAction/Contact/index.astro'",
      "from './CallToAction/Contact'",
      '<Contact',
      '<Contact/>',
      '<Contact '
    ]
  },
  {
    name: 'Whitepaper',
    path: '/test-project/src/components/CallToAction/Whitepaper/index.astro',
    importPatterns: [
      "from '@components/CallToAction/Whitepaper/index.astro'",
      "from '@components/CallToAction/Whitepaper'",
      "from 'src/components/CallToAction/Whitepaper/index.astro'",
      "from 'src/components/CallToAction/Whitepaper'",
      "from '../CallToAction/Whitepaper/index.astro'",
      "from '../CallToAction/Whitepaper'",
      "from './CallToAction/Whitepaper/index.astro'",
      "from './CallToAction/Whitepaper'",
      '<Whitepaper',
      '<Whitepaper/>',
      '<Whitepaper '
    ]
  }
]

// Mock file system structure for testing
export const mockFileSystem: Record<string, string> = {
  // Valid page with single Newsletter
  '/test-project/src/pages/valid-single.astro': `
---
import Layout from '@layouts/Base.astro'
import Newsletter from '@components/CallToAction/Newsletter/index.astro'
---

<Layout>
  <h1>Valid Page</h1>
  <Newsletter />
</Layout>
  `.trim(),

  // Invalid page with multiple Newsletter components
  '/test-project/src/pages/invalid-multiple-newsletter.astro': `
---
import Layout from '@layouts/Base.astro'
import Newsletter from '@components/CallToAction/Newsletter/index.astro'
---

<Layout>
  <h1>Invalid Page</h1>
  <Newsletter title="First Newsletter" />

  <!-- Some content -->

  <Newsletter title="Second Newsletter" />
</Layout>
  `.trim(),

  // Invalid page with multiple different CallToAction components
  '/test-project/src/pages/invalid-multiple-mixed.astro': `
---
import Layout from '@layouts/Base.astro'
import Newsletter from '@components/CallToAction/Newsletter/index.astro'
import Contact from '@components/CallToAction/Contact/index.astro'
---

<Layout>
  <h1>Mixed CallToAction Page</h1>
  <Newsletter />
  <Contact />
  <Newsletter title="Second Newsletter" />
</Layout>
  `.trim(),

  // Valid page with different CallToAction components (one each)
  '/test-project/src/pages/valid-mixed.astro': `
---
import Layout from '@layouts/Base.astro'
import Newsletter from '@components/CallToAction/Newsletter/index.astro'
import Contact from '@components/CallToAction/Contact/index.astro'
import Whitepaper from '@components/CallToAction/Whitepaper/index.astro'
---

<Layout>
  <h1>Valid Mixed Page</h1>
  <Newsletter />
  <Contact />
  <Whitepaper />
</Layout>
  `.trim(),

  // MDX file with multiple Newsletter components
  '/test-project/src/content/blog/invalid-mdx.mdx': `
---
title: "Test Blog Post"
layout: '@layouts/BlogPost.astro'
---

import Newsletter from '@components/CallToAction/Newsletter/index.astro'

# My Blog Post

Some content here.

<Newsletter title="Mid-article newsletter" />

More content.

<Newsletter title="End newsletter" />
  `.trim(),

  // Valid MDX file
  '/test-project/src/content/blog/valid-mdx.mdx': `
---
title: "Valid Blog Post"
layout: '@layouts/BlogPost.astro'
---

import Newsletter from '@components/CallToAction/Newsletter/index.astro'
import Contact from '@components/CallToAction/Contact/index.astro'

# My Valid Blog Post

Some content here.

<Newsletter title="Newsletter signup" />

More content.

<Contact />
  `.trim(),

  // Page with no CallToAction components
  '/test-project/src/pages/no-cta.astro': `
---
import Layout from '@layouts/Base.astro'
---

<Layout>
  <h1>No CallToAction</h1>
  <p>This page has no CallToAction components.</p>
</Layout>
  `.trim(),

  // Component files
  '/test-project/src/components/CallToAction/Newsletter/index.astro': `
---
interface Props {
  title?: string
}
const { title = "Subscribe" } = Astro.props
---

<section class="newsletter">
  <h2>{title}</h2>
  <form>
    <input type="email" placeholder="Enter email" />
    <button type="submit">Subscribe</button>
  </form>
</section>
  `.trim(),

  '/test-project/src/components/CallToAction/Contact/index.astro': `
---
interface Props {
  title?: string
}
const { title = "Contact Us" } = Astro.props
---

<section class="contact">
  <h2>{title}</h2>
  <p>Get in touch with us today!</p>
</section>
  `.trim(),

  '/test-project/src/components/CallToAction/Whitepaper/index.astro': `
---
interface Props {
  title?: string
  document?: string
}
const { title = "Download Whitepaper", document } = Astro.props
---

<section class="whitepaper">
  <h2>{title}</h2>
  {document && <p>Download: {document}</p>}
</section>
  `.trim(),

  // Directory structure files (for discovery testing)
  '/test-project/src/components/CallToAction/Featured/index.astro': `
---
// Featured CallToAction component
---
<div class="featured-cta">Featured content</div>
  `.trim()
}

// Test scenarios for validation results
export const validationScenarios = {
  noErrors: {
    description: 'Page with no CallToAction duplicates',
    files: ['/test-project/src/pages/valid-single.astro', '/test-project/src/pages/valid-mixed.astro'],
    expectedErrors: 0
  },

  newsletterDuplicates: {
    description: 'Page with multiple Newsletter components',
    files: ['/test-project/src/pages/invalid-multiple-newsletter.astro'],
    expectedErrors: 1,
    expectedErrorComponent: 'Newsletter',
    expectedErrorCount: 2
  },

  mixedDuplicates: {
    description: 'Page with multiple instances of mixed components',
    files: ['/test-project/src/pages/invalid-multiple-mixed.astro'],
    expectedErrors: 1,
    expectedErrorComponent: 'Newsletter',
    expectedErrorCount: 2
  },

  mdxDuplicates: {
    description: 'MDX file with duplicate components',
    files: ['/test-project/src/content/blog/invalid-mdx.mdx'],
    expectedErrors: 1,
    expectedErrorComponent: 'Newsletter',
    expectedErrorCount: 2
  }
}

// Component discovery test data
export const discoveryScenarios = {
  fullDiscovery: {
    description: 'Discover all CallToAction components',
    componentPath: 'src/components/CallToAction',
    expectedComponents: ['Newsletter', 'Contact', 'Whitepaper', 'Featured'],
    expectedPatternCount: 11 // Each component should have 11 import patterns
  },

  emptyDirectory: {
    description: 'Handle empty component directory',
    componentPath: 'src/components/EmptyDir',
    expectedComponents: [],
    expectedPatternCount: 0
  }
}

// Integration configuration test cases
export const configurationTests = {
  defaultConfig: {
    description: 'Test with default configuration',
    options: {},
    expectedComponentPath: 'src/components/CallToAction',
    expectedDebug: false
  },

  customConfig: {
    description: 'Test with custom configuration',
    options: {
      componentPath: 'src/custom/CallToAction',
      debug: true,
      additionalPatterns: ['custom-pattern']
    },
    expectedComponentPath: 'src/custom/CallToAction',
    expectedDebug: true
  }
}

/**
 * Helper to create mock file system
 */
export function createMockFileSystem() {
  const files = new Map<string, string>()

  Object.entries(mockFileSystem).forEach(([path, content]) => {
    files.set(path, content)
  })

  return files
}

/**
 * Helper to get project root for tests
 */
export function getTestProjectRoot(): string {
  return '/test-project'
}