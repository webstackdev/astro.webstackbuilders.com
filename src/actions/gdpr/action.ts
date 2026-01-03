import emailValidator from 'email-validator'
import { validate as uuidValidate } from 'uuid'
import { z } from 'astro:schema'
import { defineAction } from 'astro:actions'
import {
  checkRateLimit,
  rateLimiters
} from '@actions/utils/rateLimit'
import {
  buildRequestFingerprint,
  createRateLimitIdentifier
} from '@actions/utils/requestContext'
import {
  ActionsFunctionError,
  handleActionsFunctionError
} from '@actions/utils/errors'
import type {
  ConsentResponse,
  DSARRequestInput,
  DSARResponse,
  DsarVerifyResult,
} from '@actions/gdpr/@types'
import {
  consentCreateSchema,
  consentListSchema,
  consentDeleteSchema,
  dsarRequestSchema,
} from '@actions/gdpr/domain'
import {
  buildRateLimitError,
  mapConsentRecord,
} from '@actions/gdpr/responder'
import {
  createConsentRecord,
  createConsentRecordInput,
  deleteConsentRecords,
  findConsentRecords,
} from '@actions/gdpr/entities/consent'
import {
  createDsarRequest,
  findActiveRequestByEmail,
  verifyDsarToken,
} from '@actions/gdpr/entities/dsar'
import { sendDsarVerificationEmail } from '@actions/gdpr/entities/email'

export const gdpr = {
  verifyDsar: defineAction({
    accept: 'json',
    input: z.object({ token: z.string().min(1) }),
    handler: async (input, context): Promise<DsarVerifyResult> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/gdpr/verifyDsar',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('gdpr:dsar:verify', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.export, rateLimitIdentifier)
      if (!success) {
        buildRateLimitError(reset, 'Too many requests')
      }

      try {
        return await verifyDsarToken(input.token)
      } catch (error) {
        handleActionsFunctionError(error, {
          route: '/_actions/gdpr/verifyDsar',
          operation: 'verifyDsar',
        })
        return { status: 'error' }
      }
    },
  }),

  consentCreate: defineAction({
    accept: 'json',
    input: consentCreateSchema,
    handler: async (body, context): Promise<ConsentResponse> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/gdpr/consentCreate',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('gdpr:consent:post', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.consent, rateLimitIdentifier)
      if (!success) {
        buildRateLimitError(reset)
      }

      if (!uuidValidate(body.DataSubjectId)) {
        throw new ActionsFunctionError('Invalid DataSubjectId', { status: 400 })
      }

      const dbRecord = await createConsentRecord(createConsentRecordInput(body))

      return {
        success: true,
        record: mapConsentRecord(dbRecord),
      }
    },
  }),

  consentList: defineAction({
    accept: 'json',
    input: consentListSchema,
    handler: async (
      input,
      context
    ): Promise<{
      success: true
      records: ConsentResponse['record'][]
      hasActive?: boolean
      activeRecord?: ConsentResponse['record']
    }> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/gdpr/consentList',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('gdpr:consent:get', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.consentRead, rateLimitIdentifier)
      if (!success) {
        buildRateLimitError(reset)
      }

      const { DataSubjectId, purpose } = input

      if (!DataSubjectId || !uuidValidate(DataSubjectId)) {
        throw new ActionsFunctionError('Valid DataSubjectId required', { status: 400 })
      }

      const fetched = await findConsentRecords(DataSubjectId)
      const filteredRecords = purpose
        ? fetched.filter(record => record.purposes.includes(purpose))
        : fetched
      const records = filteredRecords.map(mapConsentRecord)

      const response: {
        success: true
        records: ConsentResponse['record'][]
        hasActive?: boolean
        activeRecord?: ConsentResponse['record']
      } = {
        success: true,
        records,
      }

      if (purpose) {
        response.hasActive = records.length > 0
        if (records[0]) {
          response.activeRecord = records[0]
        }
      }

      return response
    },
  }),

  consentDelete: defineAction({
    accept: 'json',
    input: consentDeleteSchema,
    handler: async (input, context): Promise<{ success: true; deletedCount: number }> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/gdpr/consentDelete',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('gdpr:consent:delete', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.delete, rateLimitIdentifier)
      if (!success) {
        buildRateLimitError(reset)
      }

      if (!uuidValidate(input.DataSubjectId)) {
        throw new ActionsFunctionError('Valid DataSubjectId required', { status: 400 })
      }

      const deletedCount = await deleteConsentRecords(input.DataSubjectId)
      return { success: true, deletedCount }
    },
  }),

  requestData: defineAction({
    accept: 'json',
    input: dsarRequestSchema,
    handler: async (input: DSARRequestInput, context): Promise<DSARResponse> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/gdpr/requestData',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('gdpr:dsar:request', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.export, rateLimitIdentifier)
      if (!success) {
        buildRateLimitError(reset, 'Too many requests. Try again later.')
      }

      if (!emailValidator.validate(input.email)) {
        throw new ActionsFunctionError('Invalid email format', { status: 400 })
      }

      const email = input.email.toLowerCase().trim()
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const existing = await findActiveRequestByEmail(email, input.requestType)

      if (existing) {
        await sendDsarVerificationEmail(email, existing.token, input.requestType)
        return {
          success: true,
          message: 'Verification email sent. Please check your inbox.',
        }
      }

      await createDsarRequest({
        token,
        email,
        requestType: input.requestType,
        expiresAt,
      })

      await sendDsarVerificationEmail(email, token, input.requestType)

      return {
        success: true,
        message:
          'Verification email sent. Please check your inbox and click the link to complete your request.',
      }
    },
  }),

  exportByDataSubjectId: defineAction({
    accept: 'json',
    input: z.object({ DataSubjectId: z.string().min(1) }),
    handler: async (input, context): Promise<{ success: true; json: string; filename: string }> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/gdpr/exportByDataSubjectId',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('gdpr:export:get', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.export, rateLimitIdentifier)
      if (!success) {
        buildRateLimitError(reset)
      }

      if (!uuidValidate(input.DataSubjectId)) {
        throw new ActionsFunctionError('Invalid DataSubjectId', { status: 400 })
      }

      const consentRecords = await findConsentRecords(input.DataSubjectId)
      const exportData = consentRecords.map(record => ({
        id: record.id,
        data_subject_id: record.dataSubjectId,
        email: record.email,
        purposes: record.purposes,
        source: record.source,
        user_agent: record.userAgent,
        privacy_policy_version: record.privacyPolicyVersion,
        consent_text: record.consentText,
        verified: record.verified,
        created_at: record.createdAt.toISOString(),
      }))

      return {
        success: true,
        filename: `my-data-${Date.now()}.json`,
        json: JSON.stringify(exportData, null, 2),
      }
    },
  }),
}
