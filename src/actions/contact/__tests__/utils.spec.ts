import { describe, expect, it } from 'vitest'
import { z } from 'astro/zod'

import {
  containsSpam,
  contactTimelineSchema,
  emptyStringToUndefined,
  escapeHtml,
  formatFileSize,
  isFile,
  optionalTrimmedString,
  parseBoolean,
  readString,
  requiredString,
  trimString,
} from '../utils'

describe('contact utils', () => {
  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      expect(escapeHtml(`Tom & Jerry <script>"x"</script> 'y'`)).toBe(
        'Tom &amp; Jerry &lt;script&gt;&quot;x&quot;&lt;/script&gt; &#039;y&#039;'
      )
    })
  })

  describe('formatFileSize', () => {
    it('formats bytes and KB/MB boundaries', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1023)).toBe('1023 B')
      expect(formatFileSize(1024)).toBe('1.00 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB')
    })
  })

  describe('parseBoolean', () => {
    it('treats null and non-true values as false', () => {
      expect(parseBoolean(null)).toBe(false)
      expect(parseBoolean('false')).toBe(false)
      expect(parseBoolean('')).toBe(false)
    })

    it('parses "true" as true', () => {
      expect(parseBoolean('true')).toBe(true)
    })

    it('treats non-string values as false', () => {
      const file = new File(['x'], 'x.txt', { type: 'text/plain' })
      expect(parseBoolean(file)).toBe(false)
    })
  })

  describe('readString', () => {
    it('reads string values from FormData', () => {
      const form = new FormData()
      form.set('name', 'Jane')
      expect(readString(form, 'name')).toBe('Jane')
    })

    it('returns empty string when missing or non-string', () => {
      const form = new FormData()
      expect(readString(form, 'missing')).toBe('')

      form.set('file', new File(['x'], 'x.txt', { type: 'text/plain' }))
      expect(readString(form, 'file')).toBe('')
    })
  })

  describe('trimString', () => {
    it('trims string values and leaves non-strings untouched', () => {
      expect(trimString('  hi  ')).toBe('hi')
      expect(trimString(123)).toBe(123)
      expect(trimString(null)).toBe(null)
    })
  })

  describe('emptyStringToUndefined', () => {
    it('maps null and empty/whitespace strings to undefined', () => {
      expect(emptyStringToUndefined(null)).toBeUndefined()
      expect(emptyStringToUndefined('')).toBeUndefined()
      expect(emptyStringToUndefined('   ')).toBeUndefined()
    })

    it('trims non-empty strings', () => {
      expect(emptyStringToUndefined('  ok ')).toBe('ok')
    })
  })

  describe('optionalTrimmedString', () => {
    it('treats null and whitespace as undefined', () => {
      const schema = z.object({ value: optionalTrimmedString(10) })

      expect(schema.parse({ value: null }).value).toBeUndefined()
      expect(schema.parse({ value: '   ' }).value).toBeUndefined()
    })

    it('trims and enforces max length when provided', () => {
      const schema = z.object({ value: optionalTrimmedString(3) })

      expect(schema.parse({ value: ' ok ' }).value).toBe('ok')

      const result = schema.safeParse({ value: 'abcd' })
      expect(result.success).toBe(false)
    })
  })

  describe('requiredString', () => {
    it('rejects null and empty string via preprocess', () => {
      const schema = z.object({
        name: requiredString({
          required_error: 'Name required',
          invalid_type_error: 'Invalid name',
          min: { value: 2, message: 'Too short' },
          max: { value: 10, message: 'Too long' },
        }),
      })

      const nullResult = schema.safeParse({ name: null })
      expect(nullResult.success).toBe(false)

      const emptyResult = schema.safeParse({ name: '   ' })
      expect(emptyResult.success).toBe(false)
    })

    it('accepts valid string and enforces min/max', () => {
      const schema = z.object({
        name: requiredString({
          required_error: 'Name required',
          invalid_type_error: 'Invalid name',
          min: { value: 2, message: 'Too short' },
          max: { value: 4, message: 'Too long' },
        }),
      })

      expect(schema.parse({ name: ' ok ' }).name).toBe('ok')

      const tooLong = schema.safeParse({ name: 'abcde' })
      expect(tooLong.success).toBe(false)
    })
  })

  describe('isFile', () => {
    it('returns true only for File instances', () => {
      expect(isFile(new File(['x'], 'x.txt', { type: 'text/plain' }))).toBe(true)
      expect(isFile('not-a-file')).toBe(false)
      expect(isFile(null)).toBe(false)
    })
  })

  describe('contactTimelineSchema', () => {
    it('accepts allowed timeline values', () => {
      const schema = z.object({ timeline: contactTimelineSchema })
      expect(schema.parse({ timeline: '2-3-months' }).timeline).toBe('2-3-months')
    })

    it('rejects unknown values', () => {
      const schema = z.object({ timeline: contactTimelineSchema })
      const result = schema.safeParse({ timeline: 'tomorrow' })
      expect(result.success).toBe(false)
    })
  })

  describe('containsSpam', () => {
    it('flags common spam keywords case-insensitively', () => {
      expect(containsSpam('This contains VIAGRA')).toBe(true)
      expect(containsSpam('Normal business inquiry')).toBe(false)
    })
  })
})
