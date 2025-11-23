/**
 * Unit tests for newsletter confirmation API endpoint
 */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import type { APIContext } from 'astro'
import { GET } from '@pages/api/newsletter/confirm'

const supabaseMocks = vi.hoisted(() => ({
	supabaseFromMock: vi.fn(),
}))

// Mock dependencies
vi.mock('@pages/api/newsletter/_token', () => ({
	confirmSubscription: vi.fn(),
}))

vi.mock('@pages/api/newsletter/_email', () => ({
	sendWelcomeEmail: vi.fn(),
}))

const createSupabaseQueryBuilder = () => {
	const builder = {
		update: vi.fn(),
		eq: vi.fn(),
		contains: vi.fn(),
	}

	builder.update.mockReturnThis()
	builder.eq.mockReturnThis()
	builder.contains.mockResolvedValue({ error: null })

	return builder
}

let supabaseQueryBuilder = createSupabaseQueryBuilder()

vi.mock('@pages/api/_utils', () => ({
	supabaseAdmin: {
		from: supabaseMocks.supabaseFromMock,
	},
}))

const supabaseFromMock = supabaseMocks.supabaseFromMock

const createRequestContext = (inputUrl: string): APIContext => {
	const url = new URL(inputUrl)
	const request = new Request(url.toString(), {
		method: 'GET',
		headers: {
			'user-agent': 'Test Browser',
		},
	})

	return {
		request,
		url,
		params: {},
		locals: {},
		redirect: vi.fn(),
	} as unknown as APIContext
}

vi.mock('@pages/api/newsletter/index', () => ({
	subscribeToConvertKit: vi.fn(),
}))

const tokenModule = await import('@pages/api/newsletter/_token')
const emailModule = await import('@pages/api/newsletter/_email')
const convertKitModule = await import('@pages/api/newsletter/index')

const mockConfirmSubscription = tokenModule.confirmSubscription as Mock
const mockSendWelcomeEmail = emailModule.sendWelcomeEmail as Mock
const mockSubscribeToConvertKit = convertKitModule.subscribeToConvertKit as Mock

describe('Newsletter Confirmation API - GET /api/newsletter/confirm', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Suppress console output
		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.spyOn(console, 'warn').mockImplementation(() => {})

		supabaseQueryBuilder = createSupabaseQueryBuilder()
		supabaseFromMock.mockReturnValue(supabaseQueryBuilder)
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

		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm?token=valid-token-123'))
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
		expect(data.status).toBe('success')
		expect(data.email).toBe('test@example.com')
		expect(data.message).toContain('confirmed')

		// Verify Supabase consent update call
		expect(supabaseFromMock).toHaveBeenCalledWith('consent_records')
		expect(supabaseQueryBuilder.update).toHaveBeenCalledWith({ verified: true })

		// Verify welcome email was sent
		expect(mockSendWelcomeEmail).toHaveBeenCalledWith('test@example.com', 'John')

		expect(mockSubscribeToConvertKit).toHaveBeenCalledWith(
			expect.objectContaining({ email: 'test@example.com' }),
		)
	})

	it('should reject request without token', async () => {
		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm'))
		const body = await response.json()

		expect(response.status).toBe(400)
		expect(body.error).toBeDefined()
		expect(body.error.message).toContain('No token provided')
	})

	it('should handle expired or invalid token', async () => {
		mockConfirmSubscription.mockResolvedValue(null)

		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm?token=expired-token'))
		const body = await response.json()

		expect(response.status).toBe(400)
		expect(body.error).toBeDefined()
		expect(body.error.message).toContain('expired')
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

		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm?token=valid-token-123'))
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

		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm?token=valid-token-123'))

		expect(response.status).toBe(200)
		expect(supabaseFromMock).toHaveBeenCalledWith('consent_records')
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

		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm?token=valid-token-123'))
		const data = await response.json()

		// Should still succeed
		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
	})

	it('should handle confirmation service errors', async () => {
		mockConfirmSubscription.mockRejectedValue(new Error('Database error'))

		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm?token=valid-token-123'))
		const body = await response.json()

		expect(response.status).toBe(500)
		expect(body.error).toBeDefined()
		expect(body.error.message).toContain('Unable to confirm subscription.')
	})
})
