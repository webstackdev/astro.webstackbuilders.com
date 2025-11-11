import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import {
  useTestStorageEngine,
  setTestStorageKey,
  cleanTestStorage,
  getTestStorage,
} from '@nanostores/persistent'
import { getOrCreateDataSubjectId, deleteDataSubjectId } from '@lib/helpers/dataSubjectId'

describe('DataSubjectId Management', () => {
  beforeAll(() => {
    useTestStorageEngine()
  })

  afterEach(() => {
    cleanTestStorage()
  })

  describe('getOrCreateDataSubjectId', () => {
    it('creates new UUID if none exists', () => {
      const id = getOrCreateDataSubjectId()
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(getTestStorage()).toHaveProperty('DataSubjectId', id)
    })

    it('retrieves existing ID from storage', () => {
      setTestStorageKey('DataSubjectId', 'test-uuid-123')
      const id = getOrCreateDataSubjectId()
      expect(id).toBe('test-uuid-123')
    })

    it('generates new ID if stored ID is invalid', () => {
      setTestStorageKey('DataSubjectId', 'invalid-uuid')
      const id = getOrCreateDataSubjectId()
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(id).not.toBe('invalid-uuid')
    })
  })

  describe('deleteDataSubjectId', () => {
    it('deletes DataSubjectId from storage', () => {
      setTestStorageKey('DataSubjectId', 'test-uuid-123')
      deleteDataSubjectId()
      expect(getTestStorage()).not.toHaveProperty('DataSubjectId')
    })

    it('handles deletion when no ID exists', () => {
      expect(() => deleteDataSubjectId()).not.toThrow()
      expect(getTestStorage()).not.toHaveProperty('DataSubjectId')
    })
  })
})
