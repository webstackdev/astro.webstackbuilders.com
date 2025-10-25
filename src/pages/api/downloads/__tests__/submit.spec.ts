/**
 * Unit tests for downloads form API endpoint
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from '../submit'

describe('Downloads API - POST /api/downloads/submit', () => {
	beforeEach(() => {
		// Reset any state if needed
	})

	it('should accept valid download form submission', async () => {
		const request = new Request('http://localhost/api/downloads/submit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				firstName: 'John',
				lastName: 'Doe',
				workEmail: 'john.doe@company.com',
				jobTitle: 'Software Engineer',
				companyName: 'Acme Corp',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
		expect(data.message).toContain('success')
	})

	it('should reject submission without firstName', async () => {
		const request = new Request('http://localhost/api/downloads/submit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				lastName: 'Doe',
				workEmail: 'john.doe@company.com',
				jobTitle: 'Software Engineer',
				companyName: 'Acme Corp',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.message).toContain('required')
	})

	it('should reject submission without lastName', async () => {
		const request = new Request('http://localhost/api/downloads/submit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				firstName: 'John',
				workEmail: 'john.doe@company.com',
				jobTitle: 'Software Engineer',
				companyName: 'Acme Corp',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.message).toContain('required')
	})

	it('should reject submission without workEmail', async () => {
		const request = new Request('http://localhost/api/downloads/submit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				firstName: 'John',
				lastName: 'Doe',
				jobTitle: 'Software Engineer',
				companyName: 'Acme Corp',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.message).toContain('required')
	})

	it('should reject submission without jobTitle', async () => {
		const request = new Request('http://localhost/api/downloads/submit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				firstName: 'John',
				lastName: 'Doe',
				workEmail: 'john.doe@company.com',
				companyName: 'Acme Corp',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.message).toContain('required')
	})

	it('should reject submission without companyName', async () => {
		const request = new Request('http://localhost/api/downloads/submit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				firstName: 'John',
				lastName: 'Doe',
				workEmail: 'john.doe@company.com',
				jobTitle: 'Software Engineer',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.message).toContain('required')
	})

	it('should reject submission with invalid email format', async () => {
		const request = new Request('http://localhost/api/downloads/submit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				firstName: 'John',
				lastName: 'Doe',
				workEmail: 'invalid-email',
				jobTitle: 'Software Engineer',
				companyName: 'Acme Corp',
			}),
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.success).toBe(false)
		expect(data.message).toContain('Invalid email')
	})

	it('should handle malformed JSON gracefully', async () => {
		const request = new Request('http://localhost/api/downloads/submit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: 'invalid json',
		})

		const response = await POST({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(500)
		expect(data.success).toBe(false)
		expect(data.message).toContain('Internal server error')
	})
})
