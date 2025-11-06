import { describe, it, expect } from 'vitest'
import { GET } from '@pages/api/social-card'

describe('Social Card API - GET /api/social-card', () => {
	it('should return HTML template with default values', async () => {
		const request = new Request('http://localhost/api/social-card')

		const response = await GET({ request } as any)
		const html = await response.text()

		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe('text/html')
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
		expect(html).toContain('Webstack Builders')
		expect(html).toContain('Professional Web Development Services')
		expect(html).toContain('<!DOCTYPE html>')
	})

	it('should return HTML template with custom title and description', async () => {
		const request = new Request(
			'http://localhost/api/social-card?title=Custom%20Title&description=Custom%20Description'
		)

		const response = await GET({ request } as any)
		const html = await response.text()

		expect(response.status).toBe(200)
		expect(html).toContain('Custom Title')
		expect(html).toContain('Custom Description')
		expect(html).toContain('<h1>Custom Title</h1>')
	})

	it('should include date when provided', async () => {
		const request = new Request(
			'http://localhost/api/social-card?title=Article&description=Description&date=January%201,%202025'
		)

		const response = await GET({ request } as any)
		const html = await response.text()

		expect(response.status).toBe(200)
		expect(html).toContain('Published on January 1, 2025')
		expect(html).toContain('<div class="date">')
	})

	it('should handle slug parameter', async () => {
		const request = new Request(
			'http://localhost/api/social-card?slug=my-article&title=Article%20Title'
		)

		const response = await GET({ request } as any)

		expect(response.status).toBe(200)
		// Slug is used for routing but doesn't affect HTML content directly
		expect(response.headers.get('Content-Type')).toBe('text/html')
	})

	it('should return Open Graph JSON when format=og', async () => {
		const request = new Request(
			'http://localhost/api/social-card?format=og&slug=my-article&title=Article%20Title&description=Article%20Description'
		)

		const response = await GET({ request } as any)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe('application/json')
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
		expect(data).toHaveProperty('og:title', 'Article Title')
		expect(data).toHaveProperty('og:description', 'Article Description')
		expect(data).toHaveProperty('og:url', 'http://localhost/my-article')
		expect(data).toHaveProperty('twitter:card', 'summary_large_image')
	})

	it('should generate correct image URL in OG format', async () => {
		const request = new Request(
			'http://localhost/api/social-card?format=og&slug=test&title=Test%20Title&description=Test%20Desc'
		)

		const response = await GET({ request } as any)
		const data = await response.json()

		expect(data['og:image']).toContain('/api/social-card')
		expect(data['og:image']).toContain('slug=test')
		expect(data['og:image']).toContain('title=Test%20Title')
		expect(data['og:image']).toContain('description=Test%20Desc')
		expect(data['og:image']).toContain('format=html')
		expect(data['twitter:image']).toBe(data['og:image'])
	})

	it('should include proper HTML structure and styles', async () => {
		const request = new Request('http://localhost/api/social-card')

		const response = await GET({ request } as any)
		const html = await response.text()

		expect(html).toContain('<!DOCTYPE html>')
		expect(html).toContain('<html lang="en">')
		expect(html).toContain('<meta charset="utf-8"')
		expect(html).toContain('<style>')
		expect(html).toContain('width: 1200px')
		expect(html).toContain('height: 630px')
		expect(html).toContain('background: linear-gradient')
	})

	it('should handle special characters in title and description', async () => {
		const request = new Request(
			'http://localhost/api/social-card?title=Title%20%26%20Special%20%22Chars%22&description=Description%20%3Cwith%3E%20tags'
		)

		const response = await GET({ request } as any)
		const html = await response.text()

		expect(response.status).toBe(200)
		expect(html).toContain('Title & Special "Chars"')
		expect(html).toContain('Description <with> tags')
	})

	it('should include decorative elements', async () => {
		const request = new Request('http://localhost/api/social-card')

		const response = await GET({ request } as any)
		const html = await response.text()

		expect(html).toContain('<div class="decoration"></div>')
		expect(html).toContain('<div class="brand">Webstack Builders</div>')
	})

	it('should use default format as html when format parameter is missing', async () => {
		const request = new Request(
			'http://localhost/api/social-card?title=Test'
		)

		const response = await GET({ request } as any)
		const contentType = response.headers.get('Content-Type')

		expect(contentType).toBe('text/html')
	})

	it('should handle all parameters together', async () => {
		const request = new Request(
			'http://localhost/api/social-card?slug=comprehensive-test&title=Complete%20Test&description=Full%20description%20text&date=October%2026,%202025'
		)

		const response = await GET({ request } as any)
		const html = await response.text()

		expect(response.status).toBe(200)
		expect(html).toContain('Complete Test')
		expect(html).toContain('Full description text')
		expect(html).toContain('Published on October 26, 2025')
	})
})
