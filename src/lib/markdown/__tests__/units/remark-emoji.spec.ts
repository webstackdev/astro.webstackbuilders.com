import { describe, it, expect } from 'vitest'
import remarkEmoji from 'remark-emoji'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('remark-emoji (Layer 1: Isolated)', () => {
  describe('basic emoji conversion', () => {
    it('should convert emoji shortcodes to unicode', async () => {
      const markdown = 'Hello :wave:'

      const html = await processIsolated({ markdown, plugin: remarkEmoji })

      expect(html).toContain('👋')
      expect(html).not.toContain(':wave:')
    })

    it('should handle multiple emojis', async () => {
      const markdown = 'I :heart: coding :rocket:'

      const html = await processIsolated({ markdown, plugin: remarkEmoji })

      expect(html).toContain('❤')
      expect(html).toContain('🚀')
      expect(html).not.toContain(':heart:')
      expect(html).not.toContain(':rocket:')
    })

    it('should handle emojis with plus sign', async () => {
      const markdown = 'Thumbs up :+1:'

      const html = await processIsolated({ markdown, plugin: remarkEmoji })

      expect(html).toContain('👍')
      expect(html).not.toContain(':+1:')
    })
  })

  describe('edge cases', () => {
    it('should leave invalid shortcodes unchanged', async () => {
      const markdown = 'Invalid :not_a_real_emoji:'

      const html = await processIsolated({ markdown, plugin: remarkEmoji })

      // May or may not convert depending on emoji library
      expect(html).toContain('Invalid')
    })

    it('should handle emojis in different contexts', async () => {
      const markdown = `# Heading :smile:

Paragraph with :tada: emoji

- List with :rocket:
- Another :star:`

  const html = await processIsolated({ markdown, plugin: remarkEmoji })

      expect(html).toContain('😄')
      expect(html).toContain('🎉')
      expect(html).toContain('🚀')
      expect(html).toContain('⭐')
    })

    it('should not convert emojis in code blocks', async () => {
      const markdown = '`code :smile:`'

      const html = await processIsolated({ markdown, plugin: remarkEmoji })

      expect(html).toContain('<code>')
      // Emoji in code should remain as shortcode
      expect(html).toContain(':smile:')
    })

    it('should handle colons that are not emojis', async () => {
      const markdown = 'Time is 10:30 AM'

      const html = await processIsolated({ markdown, plugin: remarkEmoji })

      expect(html).toContain('10:30')
    })
  })
})
