// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { validate as uuidValidate } from 'uuid'
import {
  getOrCreateDataSubjectId,
  deleteDataSubjectId,
} from '@components/scripts/utils/dataSubjectId'

describe('DataSubjectId Management', () => {
  beforeEach(() => {
    // Clear localStorage and cookies before each test
    localStorage.clear()
    document.cookie.split(';').forEach(c => {
      const eqPos = c.indexOf('=')
      const name = eqPos > -1 ? c.slice(0, eqPos) : c
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
  })

  describe('getOrCreateDataSubjectId', () => {
    it('creates new UUID if none exists', () => {
      const id = getOrCreateDataSubjectId()
      expect(uuidValidate(id)).toBe(true)
      expect(localStorage.getItem('DataSubjectId')).toBe(id)
      expect(document.cookie).toContain(`DataSubjectId=${id}`)
    })

    it('retrieves existing ID from localStorage', () => {
      const testId = '123e4567-e89b-12d3-a456-426614174000'
      localStorage.setItem('DataSubjectId', testId)

      const id = getOrCreateDataSubjectId()
      expect(id).toBe(testId)
      expect(document.cookie).toContain(`DataSubjectId=${testId}`)
    })

    it('generates new ID if stored ID is invalid', () => {
      localStorage.setItem('DataSubjectId', 'invalid-uuid')

      const id = getOrCreateDataSubjectId()
      expect(uuidValidate(id)).toBe(true)
      expect(id).not.toBe('invalid-uuid')
      expect(localStorage.getItem('DataSubjectId')).toBe(id)
    })

    it('retrieves ID from cookie if localStorage is empty but cookie exists', () => {
      const testId = '123e4567-e89b-12d3-a456-426614174000'
      document.cookie = `DataSubjectId=${testId}; path=/`

      const id = getOrCreateDataSubjectId()
      expect(id).toBe(testId)
      expect(localStorage.getItem('DataSubjectId')).toBe(testId)
    })

    it('generates new ID if cookie ID is invalid', () => {
      document.cookie = `DataSubjectId=invalid-uuid; path=/`

      const id = getOrCreateDataSubjectId()
      expect(uuidValidate(id)).toBe(true)
      expect(id).not.toBe('invalid-uuid')
    })
  })

  describe('deleteDataSubjectId', () => {
    it('deletes DataSubjectId from localStorage and cookie', () => {
      const testId = '123e4567-e89b-12d3-a456-426614174000'
      localStorage.setItem('DataSubjectId', testId)
      document.cookie = `DataSubjectId=${testId}; path=/`

      deleteDataSubjectId()

      expect(localStorage.getItem('DataSubjectId')).toBeNull()
      // Check that cookie is either deleted or has empty value
      const cookieMatch = document.cookie.match(/DataSubjectId=([^;]*)/)
      expect(!cookieMatch || cookieMatch[1] === '').toBe(true)
    })

    it('handles deletion when no ID exists', () => {
      expect(() => deleteDataSubjectId()).not.toThrow()
      expect(localStorage.getItem('DataSubjectId')).toBeNull()
    })
  })
})
