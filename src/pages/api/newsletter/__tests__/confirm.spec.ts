/**
 * Unit tests for newsletter confirmation API endpoint
 */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import type { APIContext } from 'astro'
import { GET } from '../confirm'

// Mock dependencies
vi.mock('@api/newsletter/token', () => ({
	confirmSubscription: vi.fn(),
}))

vi.mock('@api/shared/consent-log', () => ({
	recordConsent: vi.fn(),
}))

vi.mock('@api/newsletter/email', () => ({
	sendWelcomeEmail: vi.fn(),
}))

vi.mock('@api/newsletter/newsletter', () => ({
	subscribeToConvertKit: vi.fn(),
}))

const tokenModule = await import('@api/newsletter/token')
const consentModule = await import('@api/shared/consent-log')
const emailModule = await import('@api/newsletter/email')

const mockConfirmSubscription = tokenModule.confirmSubscription as Mock
const mockRecordConsent = consentModule.recordConsent as Mock
const mockSendWelcomeEmail = emailModule.sendWelcomeEmail as Mock

describe('Newsletter Confirmation API - GET /api/newsletter/confirm', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Suppress console output
		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.spyOn(console, 'warn').mockImplementation(() => {})

		mockRecordConsent.mockResolvedValue({
			id: 'test-consent-id',
			email: 'test@example.com',
			purposes: ['marketing'],
			timestamp: new Date().toISOString(),
			source: 'newsletter_form' as const,
			userAgent: 'Test Browser',
			privacyPolicyVersion: '2025-10-20',
			verified: true,
		})
		mockSendWelcomeEmail.mockResolvedValue(undefined)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('should confirm valid token and activate subscription', async () => {
		const mockSubscription = {
			email: 'test@example.com',
			firstName: 'John',
			token: 'valid-token-123',
			createdAt: new Date().toISOString(),
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			consentTimestamp: new Date().toISOString(),
			userAgent: 'Test Browser',
			ipAddress: '192.168.1.1',
			verified: true,
			source: 'newsletter_form' as const,
		}

		mockConfirmSubscription.mockResolvedValue(mockSubscription)

		const url = new URL('http://localhost/api/newsletter/confirm?token=valid-token-123')
		const response = await GET({ url } as Partial<APIContext> as APIContext)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
		expect(data.status).toBe('success')
		expect(data.email).toBe('test@example.com')
		expect(data.message).toContain('confirmed')

		// Verify consent was recorded as verified
		expect(mockRecordConsent).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'test@example.com',
				purposes: ['marketing'],
				source: 'newsletter_form',
				verified: true,
			}),
		)

		// Verify welcome email was sent
		expect(mockSendWelcomeEmail).toHaveBeenCalledWith('test@example.com', 'John')
	})

	it('should reject request without token', async () => {
		const url = new URL('http://localhost/api/newsletter/confirm')
		const response = await GET({ url } as Partial<APIContext> as APIContext)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.status).toBe('invalid')
		expect(data.error).toContain('No token provided')
	})

	it('should handle expired or invalid token', async () => {
		mockConfirmSubscription.mockResolvedValue(null)

		const url = new URL('http://localhost/api/newsletter/confirm?token=expired-token')
		const response = await GET({ url } as Partial<APIContext> as APIContext)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.status).toBe('expired')
		expect(data.message).toContain('expired')
	})

	it('should handle subscription without firstName', async () => {
		const mockSubscription = {
			email: 'test@example.com',
			token: 'valid-token-123',
			createdAt: new Date().toISOString(),
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			consentTimestamp: new Date().toISOString(),
			userAgent: 'Test Browser',
			verified: true,
			source: 'newsletter_form' as const,
		}

		mockConfirmSubscription.mockResolvedValue(mockSubscription)

		const url = new URL('http://localhost/api/newsletter/confirm?token=valid-token-123')
		const response = await GET({ url } as Partial<APIContext> as APIContext)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
		expect(mockSendWelcomeEmail).toHaveBeenCalledWith('test@example.com', undefined)
	})

	it('should handle subscription without ipAddress', async () => {
		const mockSubscription = {
			email: 'test@example.com',
			firstName: 'John',
			token: 'valid-token-123',
			createdAt: new Date().toISOString(),
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			consentTimestamp: new Date().toISOString(),
			userAgent: 'Test Browser',
			verified: true,
			source: 'newsletter_form' as const,
		}

		mockConfirmSubscription.mockResolvedValue(mockSubscription)

		const url = new URL('http://localhost/api/newsletter/confirm?token=valid-token-123')
		const response = await GET({ url } as Partial<APIContext> as APIContext)

		expect(response.status).toBe(200)
		expect(mockRecordConsent).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'test@example.com',
				verified: true,
			}),
		)
		// Should not have ipAddress in the call
		expect(mockRecordConsent).toHaveBeenCalledWith(
			expect.not.objectContaining({
				ipAddress: expect.anything(),
			}),
		)
	})

	it('should continue even if welcome email fails', async () => {
		const mockSubscription = {
			email: 'test@example.com',
			firstName: 'John',
			token: 'valid-token-123',
			createdAt: new Date().toISOString(),
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			consentTimestamp: new Date().toISOString(),
			userAgent: 'Test Browser',
			verified: true,
			source: 'newsletter_form' as const,
		}

		mockConfirmSubscription.mockResolvedValue(mockSubscription)
		mockSendWelcomeEmail.mockRejectedValue(new Error('Email service down'))

		const url = new URL('http://localhost/api/newsletter/confirm?token=valid-token-123')
		const response = await GET({ url } as Partial<APIContext> as APIContext)
		const data = await response.json()

		// Should still succeed
		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
	})

	it('should handle confirmation service errors', async () => {
		mockConfirmSubscription.mockRejectedValue(new Error('Database error'))

		const url = new URL('http://localhost/api/newsletter/confirm?token=valid-token-123')
		const response = await GET({ url } as Partial<APIContext> as APIContext)
		const data = await response.json()

		expect(response.status).toBe(500)
		expect(data.success).toBe(false)
		expect(data.status).toBe('error')
		expect(data.error).toContain('Database error')
	})
})
