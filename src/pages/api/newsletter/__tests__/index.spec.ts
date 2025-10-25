/**
 * Unit tests for newsletter subscription API endpoint
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST, OPTIONS } from '../index'

// Mock dependencies
vi.mock('../../../../../api/newsletter/token', () => ({
	createPendingSubscription: vi.fn(),
}))

vi.mock('../../../../../api/newsletter/email', () => ({
	sendConfirmationEmail: vi.fn(),
}))

vi.mock('../../../../../api/shared/consent-log', () => ({
	recordConsent: vi.fn(),
}))

const { createPendingSubscription } = await import('../../../../../api/newsletter/token')
const { sendConfirmationEmail } = await import('../../../../../api/newsletter/email')
const { recordConsent } = await import('../../../../../api/shared/consent-log')

describe('Newsletter API - POST /api/newsletter', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(createPendingSubscription).mockResolvedValue('test-token-123')
		vi.mocked(sendConfirmationEmail).mockResolvedValue(undefined)
		vi.mocked(recordConsent).mockResolvedValue(undefined)
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
		expect(recordConsent).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'test@example.com',
				purposes: ['marketing'],
				source: 'newsletter_form',
				verified: false,
			}),
		)
		expect(createPendingSubscription).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'test@example.com',
				firstName: 'John',
			}),
		)
		expect(sendConfirmationEmail).toHaveBeenCalledWith('test@example.com', 'test-token-123', 'John')
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
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.error).toContain('Email address is required')
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
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.error).toContain('invalid')
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
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.error).toContain('consent')
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

		expect(recordConsent).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'test@example.com',
			}),
		)
	})

	it('should handle rate limiting', async () => {
		const ip = '192.168.1.100'
		const headers = {
			'Content-Type': 'application/json',
			'x-forwarded-for': ip,
		}

		// Make 10 requests (the limit)
		for (let i = 0; i < 10; i++) {
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

		// 11th request should be rate limited
		const request = new Request('http://localhost/api/newsletter', {
			method: 'POST',
			headers,
			body: JSON.stringify({
				email: 'test11@example.com',
				consentGiven: true,
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(429)
		expect(data.success).toBe(false)
		expect(data.error).toContain('Too many')
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
		expect(sendConfirmationEmail).toHaveBeenCalledWith('test@example.com', 'test-token-123', undefined)
	})

	it('should handle service errors gracefully', async () => {
		vi.mocked(createPendingSubscription).mockRejectedValue(new Error('Service unavailable'))

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

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.error).toContain('Service unavailable')
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
