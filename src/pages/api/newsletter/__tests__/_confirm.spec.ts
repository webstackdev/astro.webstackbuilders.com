/**
 * Unit tests for newsletter confirmation API endpoint
 */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import type { APIContext } from 'astro'
import type { PendingSubscription } from '@pages/api/newsletter/_token'
import { TestError } from '@test/errors'
import { GET } from '@pages/api/newsletter/confirm'

const consentMocks = vi.hoisted(() => ({
	markConsentRecordsVerified: vi.fn(),
}))

// Mock dependencies
vi.mock('@pages/api/newsletter/_token', () => ({
	confirmSubscription: vi.fn(),
}))

vi.mock('@pages/api/newsletter/_email', () => ({
	sendWelcomeEmail: vi.fn(),
}))

vi.mock('@pages/api/gdpr/_utils/consentStore', () => consentMocks)

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
const consentStoreModule = await import('@pages/api/gdpr/_utils/consentStore')

const mockConfirmSubscription = tokenModule.confirmSubscription as Mock
const mockSendWelcomeEmail = emailModule.sendWelcomeEmail as Mock
const mockSubscribeToConvertKit = convertKitModule.subscribeToConvertKit as Mock
const mockMarkConsentRecordsVerified = consentStoreModule.markConsentRecordsVerified as Mock

const buildSubscription = (overrides: Partial<PendingSubscription> = {}): PendingSubscription => ({
	email: 'test@example.com',
	firstName: 'John',
	DataSubjectId: 'data-subject-123',
	token: 'valid-token-123',
	createdAt: new Date().toISOString(),
	expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
	consentTimestamp: new Date().toISOString(),
	userAgent: 'Test Browser',
	ipAddress: '192.168.1.1',
	verified: true,
	source: 'newsletter_form',
	...overrides,
})

describe('Newsletter Confirmation API - GET /api/newsletter/confirm', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Suppress console output
		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.spyOn(console, 'warn').mockImplementation(() => {})

		mockSendWelcomeEmail.mockResolvedValue(undefined)
		mockMarkConsentRecordsVerified.mockResolvedValue(1)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('should confirm valid token and activate subscription', async () => {
		const mockSubscription = buildSubscription()

		mockConfirmSubscription.mockResolvedValue(mockSubscription)

		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm?token=valid-token-123'))
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
		expect(data.status).toBe('success')
		expect(data.email).toBe('test@example.com')
		expect(data.message).toContain('confirmed')

		// Verify consent verification helper call
		expect(mockMarkConsentRecordsVerified).toHaveBeenCalledWith('test@example.com', 'data-subject-123')
		expect(mockMarkConsentRecordsVerified).toHaveBeenCalledTimes(1)

		// Verify welcome email was sent (force mock disabled by default)
		expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
			'test@example.com',
			'John'
		)

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

		expect(response.status).toBe(200)
		expect(body.success).toBe(false)
		expect(body.status).toBe('expired')
		expect(body.message).toContain('expired')
	})

	it('should handle subscription without firstName', async () => {
		const mockSubscription = buildSubscription({ firstName: undefined })

		mockConfirmSubscription.mockResolvedValue(mockSubscription)

		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm?token=valid-token-123'))
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
		expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
			'test@example.com',
			undefined
		)
	})

	it('should handle subscription without ipAddress', async () => {
		const mockSubscription = buildSubscription({ ipAddress: undefined })

		mockConfirmSubscription.mockResolvedValue(mockSubscription)

		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm?token=valid-token-123'))

		expect(response.status).toBe(200)
		expect(mockMarkConsentRecordsVerified).toHaveBeenCalledWith('test@example.com', 'data-subject-123')
	})

	it('should continue even if welcome email fails', async () => {
		const mockSubscription = buildSubscription()

		mockConfirmSubscription.mockResolvedValue(mockSubscription)
		mockSendWelcomeEmail.mockRejectedValue(new TestError('Email service down'))

		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm?token=valid-token-123'))
		const data = await response.json()

		// Should still succeed
		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
	})

	it('should handle confirmation service errors', async () => {
		mockConfirmSubscription.mockRejectedValue(new TestError('Database error'))

		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm?token=valid-token-123'))
		const body = await response.json()

		expect(response.status).toBe(500)
		expect(body.error).toBeDefined()
		expect(body.error.message).toContain('Unable to confirm subscription.')
	})

	it('should surface errors when consent verification fails', async () => {
		const mockSubscription = buildSubscription()
		mockConfirmSubscription.mockResolvedValue(mockSubscription)
		mockMarkConsentRecordsVerified.mockRejectedValue(new TestError('Consent DB offline'))

		const response = await GET(createRequestContext('http://localhost/api/newsletter/confirm?token=valid-token-123'))
		const body = await response.json()

		expect(response.status).toBe(500)
		expect(body.error).toBeDefined()
		expect(body.error.message).toContain('Unable to confirm subscription.')
	})
})
