/**
 * Unit tests for frontmatter parsing utilities
 */

import { describe, it, expect } from 'vitest'
import { parseFrontmatter } from '../frontmatter'

describe('parseFrontmatter', () => {
  it('should parse callToActionMode from valid frontmatter', () => {
    const content = `---
title: Test Page
callToActionMode: primary-only
---

# Content here`

    const result = parseFrontmatter(content)

    expect(result).toEqual({
      callToActionMode: 'primary-only',
    })
  })

  it('should handle callToActionMode with quotes', () => {
    const content = `---
title: Test Page
callToActionMode: "none"
---

# Content`

    const result = parseFrontmatter(content)

    expect(result).toEqual({
      callToActionMode: 'none',
    })
  })

  it('should handle callToActionMode with single quotes', () => {
    const content = `---
callToActionMode: 'many'
---`

    const result = parseFrontmatter(content)

    expect(result).toEqual({
      callToActionMode: 'many',
    })
  })

  it('should handle default mode', () => {
    const content = `---
callToActionMode: default
---`

    const result = parseFrontmatter(content)

    expect(result).toEqual({
      callToActionMode: 'default',
    })
  })

  it('should return empty object when no frontmatter exists', () => {
    const content = '# Just content, no frontmatter'

    const result = parseFrontmatter(content)

    expect(result).toEqual({})
  })

  it('should return empty object when frontmatter is empty', () => {
    const content = `---
---

# Content`

    const result = parseFrontmatter(content)

    expect(result).toEqual({})
  })

  it('should ignore other frontmatter fields', () => {
    const content = `---
title: Test
author: John Doe
date: 2025-01-01
callToActionMode: none
tags: [test, example]
---`

    const result = parseFrontmatter(content)

    expect(result).toEqual({
      callToActionMode: 'none',
    })
  })

  it('should return empty object when callToActionMode is not present', () => {
    const content = `---
title: Test Page
author: Jane Doe
---`

    const result = parseFrontmatter(content)

    expect(result).toEqual({})
  })

  it('should handle malformed frontmatter gracefully', () => {
    const content = `---
this is not valid yaml
callToActionMode should be here
---`

    const result = parseFrontmatter(content)

    expect(result).toEqual({})
  })

  it('should handle frontmatter with extra whitespace', () => {
    const content = `---
callToActionMode:   primary-only   
---`

    const result = parseFrontmatter(content)

    expect(result).toEqual({
      callToActionMode: 'primary-only',
    })
  })
})
