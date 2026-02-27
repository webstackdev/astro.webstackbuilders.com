import { describe, expect, it } from 'vitest'

import { formatLanguageLabel } from '../codeBlocks'

describe('formatLanguageLabel', () => {
  it('formats known aliases and canonical names', () => {
    expect(formatLanguageLabel('js')).toBe('JavaScript')
    expect(formatLanguageLabel('javascript')).toBe('JavaScript')
    expect(formatLanguageLabel('ts')).toBe('TypeScript')
    expect(formatLanguageLabel('typescript')).toBe('TypeScript')
    expect(formatLanguageLabel('md')).toBe('Markdown')
  })

  it('formats configured acronym and mixed-case language labels', () => {
    expect(formatLanguageLabel('html')).toBe('HTML')
    expect(formatLanguageLabel('yaml')).toBe('YAML')
    expect(formatLanguageLabel('yml')).toBe('YAML')
    expect(formatLanguageLabel('promql')).toBe('PromQL')
  })

  it('capitalizes unknown languages by default', () => {
    expect(formatLanguageLabel('python')).toBe('Python')
    expect(formatLanguageLabel('ruby')).toBe('Ruby')
  })

  it('normalizes case and surrounding whitespace before lookup', () => {
    expect(formatLanguageLabel('  JS  ')).toBe('JavaScript')
    expect(formatLanguageLabel('  YaMl  ')).toBe('YAML')
  })
})
