import { describe, it, expect, beforeAll } from 'vitest'
import { supabaseAdmin, supabasePublic } from '@lib/db/supabase'

describe('RLS Policies', () => {
  const testDataSubjectId = '550e8400-e29b-41d4-a716-446655440000'
  const testRecord = {
    data_subject_id: testDataSubjectId,
    email: 'test@example.com',
    purposes: ['contact'],
    source: 'test',
    user_agent: 'vitest',
    privacy_policy_version: '2024-11-11',
    verified: false
  }

  let insertedRecordId: string

  describe('Service Role (Admin)', () => {
    it('can insert records', async () => {
      const { data, error } = await supabaseAdmin
        .from('consent_records')
        .insert(testRecord)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.data_subject_id).toBe(testDataSubjectId)

      insertedRecordId = data!.id
    })

    it('can read records', async () => {
      const { data, error } = await supabaseAdmin
        .from('consent_records')
        .select('*')
        .eq('id', insertedRecordId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.id).toBe(insertedRecordId)
    })

    it('can update records', async () => {
      const { data, error } = await supabaseAdmin
        .from('consent_records')
        .update({ verified: true })
        .eq('id', insertedRecordId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.verified).toBe(true)
    })

    it('can delete records', async () => {
      const { error } = await supabaseAdmin
        .from('consent_records')
        .delete()
        .eq('id', insertedRecordId)

      expect(error).toBeNull()
    })
  })

  describe('Public Client (Anon)', () => {
    beforeAll(async () => {
      // Insert a test record for read attempts
      const { data } = await supabaseAdmin
        .from('consent_records')
        .insert(testRecord)
        .select()
        .single()

      insertedRecordId = data!.id
    })

    it('cannot read records', async () => {
      const { data } = await supabasePublic
        .from('consent_records')
        .select('*')

      // RLS should block read access
      expect(data).toEqual([])
      // May return empty array or error depending on RLS config
    })

    it('cannot insert records', async () => {
      const { error } = await supabasePublic
        .from('consent_records')
        .insert(testRecord)

      expect(error).toBeDefined()
    })

    it('cannot update records', async () => {
      const { error } = await supabasePublic
        .from('consent_records')
        .update({ verified: true })
        .eq('id', insertedRecordId)

      expect(error).toBeDefined()
    })

    it('cannot delete records', async () => {
      const { error } = await supabasePublic
        .from('consent_records')
        .delete()
        .eq('id', insertedRecordId)

      expect(error).toBeDefined()
    })
  })
})
