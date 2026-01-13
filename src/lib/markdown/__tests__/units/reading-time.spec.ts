import { describe, expect, it } from 'vitest'
import { getReadingTimeLabel } from '@lib/markdown/utils/readingTime'

describe('getReadingTimeLabel', () => {
  it('returns undefined for empty content', () => {
    expect(getReadingTimeLabel('')).toBeUndefined()
  })

  it('returns at least 1 minute for short content', () => {
    expect(getReadingTimeLabel('hello world')).toBe('1 min read')
  })

  it('rounds up minutes based on word count', () => {
    const twoHundredAndOneWords = Array.from({ length: 201 }, () => 'word').join(' ')
    expect(getReadingTimeLabel(twoHundredAndOneWords, { wordsPerMinute: 200 })).toBe('2 min read')
  })

  it('strips fenced code blocks and mdx imports', () => {
    const content = `---
    title: Test
    ---
    import X from './X.mdx'

    Hello world

    \`\`\`ts
    const secret = 123
    \`\`\`
    `

    expect(getReadingTimeLabel(content, { wordsPerMinute: 200 })).toBe('1 min read')
  })
})
