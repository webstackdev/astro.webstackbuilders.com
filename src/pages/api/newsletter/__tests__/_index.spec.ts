/**
 * Unit tests for newsletter subscription API endpoint
 */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { POST, OPTIONS } from '@pages/api/newsletter'

const rateLimitMocks = vi.hoisted(() => ({
	rateLimiters: {
		consent: {},
	},
	checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}))

const consentMocks = vi.hoisted(() => ({
	recordConsent: vi.fn(),
}))

// Mock dependencies
vi.mock('@pages/api/newsletter/_token', () => ({
	createPendingSubscription: vi.fn(),
}))

vi.mock('@pages/api/newsletter/_email', () => ({
	sendConfirmationEmail: vi.fn(),
}))

vi.mock('@pages/api/_logger', () => consentMocks)

vi.mock('@pages/api/_utils/rateLimit', () => ({
	rateLimiters: rateLimitMocks.rateLimiters,
	checkRateLimit: rateLimitMocks.checkRateLimit,
	checkContactRateLimit: vi.fn(),
}))

const tokenModule = await import('@pages/api/newsletter/_token')
const emailModule = await import('@pages/api/newsletter/_email')
const mockRecordConsent = consentMocks.recordConsent as Mock

const mockCreatePendingSubscription = tokenModule.createPendingSubscription as Mock
const mockSendConfirmationEmail = emailModule.sendConfirmationEmail as Mock

describe('Newsletter API - POST /api/newsletter', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Suppress console output
		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.spyOn(console, 'warn').mockImplementation(() => {})

		mockCreatePendingSubscription.mockResolvedValue('test-token-123')
		mockSendConfirmationEmail.mockResolvedValue(undefined)
		mockRecordConsent.mockResolvedValue({
			id: 'test-consent-id',
			email: 'test@example.com',
			purposes: ['marketing'],
			timestamp: '2025-10-31T00:00:00.000Z',
			source: 'newsletter_form',
			userAgent: 'test-agent',
			privacyPolicyVersion: '2025-10-20',
			verified: false
		})
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('should accept valid newsletter subscription with consent', async () => {
		const request = new Request('http://localhost/api/newsletter', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '192.168.1.1',
				'user-agent': 'Test Browser',
			},
			body: JSON.stringify({
				email: 'test@example.com',
				firstName: 'John',
				consentGiven: true,
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
		expect(data.message).toContain('check your email')
		expect(data.requiresConfirmation).toBe(true)

		// Verify mocks were called correctly
		expect(mockRecordConsent).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'test@example.com',
				purposes: ['marketing'],
				source: 'newsletter_form',
				verified: false,
			}),
		)
		expect(mockCreatePendingSubscription).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'test@example.com',
				firstName: 'John',
			}),
		)
		expect(mockSendConfirmationEmail).toHaveBeenCalledWith('test@example.com', 'test-token-123', 'John')
	})

	it('should reject subscription without email', async () => {
		const request = new Request('http://localhost/api/newsletter', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				consentGiven: true,
			}),
		})

		const response = await POST({ request } as any)
		const body = await response.json()

		expect(response.status).toBe(400)
		expect(body.error).toBeDefined()
		expect(body.error.message).toContain('Email address is required')
	})

	it('should reject subscription with invalid email format', async () => {
		const request = new Request('http://localhost/api/newsletter', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'invalid-email',
				consentGiven: true,
			}),
		})

		const response = await POST({ request } as any)
		const body = await response.json()

		expect(response.status).toBe(400)
		expect(body.error).toBeDefined()
		expect(body.error.message).toContain('invalid')
	})

	it('should reject subscription without consent', async () => {
		const request = new Request('http://localhost/api/newsletter', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'test@example.com',
				consentGiven: false,
			}),
		})

		const response = await POST({ request } as any)
		const body = await response.json()

		expect(response.status).toBe(400)
		expect(body.error).toBeDefined()
		expect(body.error.message).toContain('consent')
	})

	it('should normalize email to lowercase', async () => {
		const request = new Request('http://localhost/api/newsletter', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'TEST@EXAMPLE.COM',
				consentGiven: true,
			}),
		})

		await POST({ request } as any)

		expect(mockRecordConsent).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'test@example.com',
			}),
		)
	})

	it('should bypass rate limiting in test environment', async () => {
		// In test/dev/CI environments, rate limiting is disabled
		// This test verifies that we can make unlimited requests
		const ip = '192.168.1.100'
		const headers = {
			'Content-Type': 'application/json',
			'x-forwarded-for': ip,
		}

		// Make 20 requests - normally limited to 10 per 15 minutes
		// All should succeed because rate limiting is bypassed
		for (let i = 0; i < 20; i++) {
			const request = new Request('http://localhost/api/newsletter', {
				method: 'POST',
				headers,
				body: JSON.stringify({
					email: `test${i}@example.com`,
					consentGiven: true,
				}),
			})
			const response = await POST({ request } as any)
			expect(response.status).toBe(200)
		}
	})

	it('should handle missing firstName gracefully', async () => {
		const request = new Request('http://localhost/api/newsletter', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'test@example.com',
				consentGiven: true,
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
		expect(mockSendConfirmationEmail).toHaveBeenCalledWith('test@example.com', 'test-token-123', undefined)
	})

	it('should handle service errors gracefully', async () => {
		mockCreatePendingSubscription.mockRejectedValue(new Error('Service unavailable'))

		const request = new Request('http://localhost/api/newsletter', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'test@example.com',
				consentGiven: true,
			}),
		})

		const response = await POST({ request } as any)
		const body = await response.json()

		expect(response.status).toBe(500)
		expect(body.error).toBeDefined()
		expect(body.error.message).toContain('Failed to process newsletter request.')
	})
})

describe('Newsletter API - OPTIONS /api/newsletter', () => {
	it('should return CORS headers', async () => {
		const response = await OPTIONS({} as any)

		expect(response.status).toBe(200)
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
		expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
		expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
	})
})
