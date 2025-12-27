/**
 * Unit tests for CTA requirements validation
 */

import { describe, it, expect } from 'vitest'
import { validatePageCtaRequirements } from '../requirements'
import type { PageAnalysis } from '../../@types'

describe('validatePageCtaRequirements', () => {
  const createAnalysis = (overrides: Partial<PageAnalysis> = {}): PageAnalysis => ({
    path: '/test/page.astro',
    contentType: 'articles',
    frontmatter: {},
    hasPrimaryCta: false,
    hasSecondaryCta: false,
    ctaComponents: [],
    slug: 'test-article',
    collectionName: 'articles',
    isDynamicRoute: false,
    ...overrides,
  })

  describe('mode: none', () => {
    it('should return no warnings when mode is none', () => {
      const analysis = createAnalysis()
      const warnings = validatePageCtaRequirements(analysis, 'none')

      expect(warnings).toHaveLength(0)
    })
  })

  describe('mode: default', () => {
    it('should warn when missing primary CTA', () => {
      const analysis = createAnalysis({
        hasPrimaryCta: false,
        hasSecondaryCta: false,
      })

      const warnings = validatePageCtaRequirements(analysis, 'default')

      expect(warnings).toHaveLength(1)
      expect(warnings[0]?.type).toBe('missing-primary')
      expect(warnings[0]?.message).toContain('Missing primary Call-to-Action')
    })

    it('should warn when missing secondary CTA (has primary)', () => {
      const analysis = createAnalysis({
        hasPrimaryCta: true,
        hasSecondaryCta: false,
      })

      const warnings = validatePageCtaRequirements(analysis, 'default')

      expect(warnings).toHaveLength(1)
      expect(warnings[0]?.type).toBe('missing-secondary')
      expect(warnings[0]?.message).toContain('Missing secondary Call-to-Action')
    })

    it('should return no warnings when both CTAs present', () => {
      const analysis = createAnalysis({
        hasPrimaryCta: true,
        hasSecondaryCta: true,
      })

      const warnings = validatePageCtaRequirements(analysis, 'default')

      expect(warnings).toHaveLength(0)
    })

    it('should include helpful hint about quieting warnings', () => {
      const analysis = createAnalysis({
        hasPrimaryCta: false,
      })

      const warnings = validatePageCtaRequirements(analysis, 'default')

      expect(warnings[0]?.message).toContain('callToActionMode: "none"')
    })
  })

  describe('mode: primary-only', () => {
    it('should warn when missing primary CTA', () => {
      const analysis = createAnalysis({
        hasPrimaryCta: false,
      })

      const warnings = validatePageCtaRequirements(analysis, 'primary-only')

      expect(warnings).toHaveLength(1)
      expect(warnings[0]?.type).toBe('missing-primary')
    })

    it('should not warn about missing secondary CTA', () => {
      const analysis = createAnalysis({
        hasPrimaryCta: true,
        hasSecondaryCta: false,
      })

      const warnings = validatePageCtaRequirements(analysis, 'primary-only')

      expect(warnings).toHaveLength(0)
    })
  })

  describe('mode: many', () => {
    it('should warn when fewer than 3 CTAs', () => {
      const analysis = createAnalysis({
        hasPrimaryCta: true,
        hasSecondaryCta: true,
        ctaComponents: ['Contact', 'Newsletter'],
      })

      const warnings = validatePageCtaRequirements(analysis, 'many')

      expect(warnings).toHaveLength(1)
      expect(warnings[0]?.type).toBe('missing-secondary')
      expect(warnings[0]?.message).toContain('requires 3+ Call-to-Action components')
      expect(warnings[0]?.message).toContain('found 2')
    })

    it('should not warn when 3 or more CTAs', () => {
      const analysis = createAnalysis({
        hasPrimaryCta: true,
        hasSecondaryCta: true,
        ctaComponents: ['Contact', 'Newsletter', 'Download'],
      })

      const warnings = validatePageCtaRequirements(analysis, 'many')

      expect(warnings).toHaveLength(0)
    })

    it('should still warn about missing primary CTA', () => {
      const analysis = createAnalysis({
        hasPrimaryCta: false,
        ctaComponents: ['Newsletter', 'Download', 'Other'],
      })

      const warnings = validatePageCtaRequirements(analysis, 'many')

      // Should have both warnings: missing primary AND not enough CTAs
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings.some(w => w.type === 'missing-primary')).toBe(true)
    })
  })

  describe('page identifier formatting', () => {
    it('should include slug in message for static routes', () => {
      const analysis = createAnalysis({
        slug: 'my-article',
        isDynamicRoute: false,
      })

      const warnings = validatePageCtaRequirements(analysis, 'default')

      expect(warnings[0]?.message).toContain('articles/my-article')
    })

    it('should show content file path for dynamic routes', () => {
      const analysis = createAnalysis({
        isDynamicRoute: true,
        contentFilePath: 'src/content/articles/my-article/index.md',
      })

      const warnings = validatePageCtaRequirements(analysis, 'default')

      expect(warnings[0]?.message).toContain('src/content/articles/my-article/index.md')
    })

    it('should handle index pages', () => {
      const analysis = createAnalysis({
        slug: 'index',
        isDynamicRoute: false,
      })

      const warnings = validatePageCtaRequirements(analysis, 'default')

      expect(warnings[0]?.message).toContain('articles index page')
    })
  })

  describe('warning hints', () => {
    it('should suggest "none" mode when missing primary', () => {
      const analysis = createAnalysis()
      const warnings = validatePageCtaRequirements(analysis, 'default')

      expect(warnings[0]?.message).toContain('callToActionMode: "none"')
    })

    it('should suggest "primary-only" mode when missing secondary', () => {
      const analysis = createAnalysis({
        hasPrimaryCta: true,
        hasSecondaryCta: false,
      })

      const warnings = validatePageCtaRequirements(analysis, 'default')

      expect(warnings[0]?.message).toContain('callToActionMode: "primary-only"')
    })

    it('should suggest "default" mode when in many mode with too few CTAs', () => {
      const analysis = createAnalysis({
        ctaComponents: ['Contact', 'Newsletter'],
      })

      const warnings = validatePageCtaRequirements(analysis, 'many')

      const tooFewWarning = warnings.find(w => w.message.includes('requires 3+'))
      expect(tooFewWarning?.message).toContain('callToActionMode: "default"')
    })
  })
})
