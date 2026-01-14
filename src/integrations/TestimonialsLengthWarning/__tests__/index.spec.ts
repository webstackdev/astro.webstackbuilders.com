import { describe, expect, it } from 'vitest'
import { getVisibleCharacterCount, stripFrontmatter } from '../index'

describe('TestimonialsLengthWarning', () => {
  describe('stripFrontmatter', () => {
    it('returns original string when no frontmatter exists', () => {
      expect(stripFrontmatter('Hello world')).toBe('Hello world')
    })

    it('removes YAML frontmatter and trims body', () => {
      const raw = [
        '---',
        'name: Test',
        '---',
        '',
        'This is the body.',
        '',
      ].join('\n')

      expect(stripFrontmatter(raw)).toBe('This is the body.')
    })

    it('returns original string when frontmatter is unterminated', () => {
      const raw = ['---', 'name: Test', 'This is still frontmatter'].join('\n')
      expect(stripFrontmatter(raw)).toBe(raw)
    })
  })

  describe('getVisibleCharacterCount', () => {
    it('normalizes whitespace before counting', () => {
      const text = '  Hello\n\nworld\t  '
      expect(getVisibleCharacterCount(text)).toBe('Hello world'.length)
    })

    it('returns 0 for blank strings', () => {
      expect(getVisibleCharacterCount('   \n\n\t')).toBe(0)
    })
  })
})
