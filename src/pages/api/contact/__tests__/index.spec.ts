/**
 * Unit tests for contact form API endpoint
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST, OPTIONS } from '@pages/api/contact/index'

// Mock Resend before importing the module
const mockSend = vi.fn().mockResolvedValue({ data: { id: 'test-email-id' } })

vi.mock('resend', () => {
	return {
		Resend: class MockResend {
			emails = {
				send: mockSend,
			}
		},
	}
})

// Mock fetch for GDPR consent API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Contact API - POST /api/contact', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockSend.mockResolvedValue({ data: { id: 'test-email-id' } })

		// Mock successful GDPR consent API response
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				record: {
					id: 'test-consent-id',
					DataSubjectId: 'test-uuid-123',
					email: 'test@example.com',
					purposes: ['contact'],
					timestamp: new Date().toISOString(),
					source: 'contact_form',
					userAgent: 'Test Browser',
					privacyPolicyVersion: '2025-11-09',
					verified: true,
				}
			})
		})

		// Set mock env vars
		vi.stubEnv('RESEND_API_KEY', 'test-api-key')
		vi.stubEnv('NODE_ENV', 'test')
	})

	afterEach(() => {
		vi.clearAllMocks()
		vi.unstubAllEnvs()
	})

	it('should accept valid contact form submission', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '192.168.1.1',
				'user-agent': 'Test Browser',
			},
			body: JSON.stringify({
				name: 'John Doe',
				email: 'john@example.com',
				message: 'This is a test message with sufficient length',
				consent: true,
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
		expect(data.message).toContain('Thank you')
	})

	it('should reject submission without name', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '10.0.0.2', // Unique IP to avoid rate limiting
			},
			body: JSON.stringify({
				email: 'test@example.com',
				message: 'Test message with enough content',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.error).toContain('Name is required')
	})

	it('should reject submission with short name', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '10.0.0.3', // Unique IP to avoid rate limiting
			},
			body: JSON.stringify({
				name: 'A',
				email: 'test@example.com',
				message: 'Test message with enough content',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.error).toContain('at least 2 characters')
	})

	it('should reject submission without email', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '10.0.0.4', // Unique IP to avoid rate limiting
			},
			body: JSON.stringify({
				name: 'John Doe',
				message: 'Test message with enough content',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.error).toContain('Email is required')
	})

	it('should reject submission with invalid email', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '10.0.0.5', // Unique IP to avoid rate limiting
			},
			body: JSON.stringify({
				name: 'John Doe',
				email: 'invalid-email',
				message: 'Test message with enough content',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.error).toContain('Invalid email')
	})

	it('should reject submission without message', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '10.0.0.6', // Unique IP to avoid rate limiting
			},
			body: JSON.stringify({
				name: 'John Doe',
				email: 'test@example.com',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.error).toContain('Message is required')
	})

	it('should reject submission with short message', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '10.0.0.7', // Unique IP to avoid rate limiting
			},
			body: JSON.stringify({
				name: 'John Doe',
				email: 'test@example.com',
				message: 'Too short',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.error).toContain('at least 10 characters')
	})

	it('should reject submission with spam content', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '10.0.0.8', // Unique IP to avoid rate limiting
			},
			body: JSON.stringify({
				name: 'John Doe',
				email: 'test@example.com',
				message: 'Click here to win the casino lottery with viagra',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.error).toContain('spam')
	})

	it('should bypass rate limiting in test environment', async () => {
		// In test/dev/CI environments, rate limiting is disabled
		// This test verifies that we can make unlimited requests
		const ip = '192.168.1.unique-for-ratelimit-test'
		const headers = {
			'Content-Type': 'application/json',
			'x-forwarded-for': ip,
		}

		// Make 10 requests - normally limited to 5 per 15 minutes
		// All should succeed because rate limiting is bypassed
		for (let i = 0; i < 10; i++) {
			const request = new Request('http://localhost/api/contact', {
				method: 'POST',
				headers,
				body: JSON.stringify({
					name: 'John Doe',
					email: `test${i}@example.com`,
					message: `Test message number ${i} with sufficient length`,
				}),
			})
			const response = await POST({ request } as any)
			expect(response.status).toBe(200)
		}
	})

	it('should handle optional fields correctly', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '10.0.0.9', // Unique IP to avoid rate limiting
			},
			body: JSON.stringify({
				name: 'John Doe',
				email: 'test@example.com',
				message: 'Test message with enough content',
				phone: '555-1234',
				service: 'Web Development',
				budget: '$10k-$50k',
				timeline: '3 months',
				website: 'https://example.com',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
	})

	it('should record consent when provided', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '192.168.1.1',
				'user-agent': 'Test Browser',
			},
			body: JSON.stringify({
				name: 'John Doe',
				email: 'test@example.com',
				message: 'Test message with enough content',
				consent: true,
			}),
		})

		await POST({ request } as any)

		expect(mockFetch).toHaveBeenCalledWith(
			'http://localhost/api/gdpr/consent',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
				}),
				body: expect.stringContaining('"email":"test@example.com"'),
			})
		)
	})

	it('should not record consent when not provided', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '10.0.0.10', // Unique IP to avoid rate limiting
			},
			body: JSON.stringify({
				name: 'John Doe',
				email: 'test@example.com',
				message: 'Test message with enough content',
			}),
		})

		await POST({ request } as any)

		expect(mockFetch).not.toHaveBeenCalledWith(
			expect.stringMatching(/\/api\/gdpr\/consent$/),
			expect.any(Object)
		)
	})

	it('should continue form submission even if consent logging fails', async () => {
		// Mock GDPR consent API failure
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ success: false, error: { code: 'SERVER_ERROR', message: 'Database error' } })
		})

		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '10.0.0.11', // Unique IP to avoid rate limiting
			},
			body: JSON.stringify({
				name: 'John Doe',
				email: 'test@example.com',
				message: 'Test message with enough content',
				consent: true,
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		// Form submission should still succeed
		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
		expect(data.message).toContain('Thank you')

		// Consent API should have been called but failed
		expect(mockFetch).toHaveBeenCalledWith(
			'http://localhost/api/gdpr/consent',
			expect.any(Object)
		)
	})

	it('should generate DataSubjectId when not provided', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '10.0.0.12',
			},
			body: JSON.stringify({
				name: 'John Doe',
				email: 'test@example.com',
				message: 'Test message with enough content',
				consent: true,
			}),
		})

		await POST({ request } as any)

		expect(mockFetch).toHaveBeenCalledWith(
			'http://localhost/api/gdpr/consent',
			expect.objectContaining({
				body: expect.stringMatching(/"DataSubjectId":"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"/),
			})
		)
	})

	it('should validate provided DataSubjectId', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-forwarded-for': '10.0.0.13',
			},
			body: JSON.stringify({
				name: 'John Doe',
				email: 'test@example.com',
				message: 'Test message with enough content',
				consent: true,
				DataSubjectId: 'invalid-uuid',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.error).toContain('Invalid DataSubjectId format')
	})
})

describe('Contact API - OPTIONS /api/contact', () => {
	it('should return CORS headers', async () => {
		const response = await OPTIONS({} as any)

		expect(response.status).toBe(200)
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
		expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
		expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
	})
})
