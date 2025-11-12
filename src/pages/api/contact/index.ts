/**
 * Astro API endpoint for contact form submission
 * Implements file upload support with Resend email delivery
 *
 * With Vercel adapter, this becomes a serverless function automatically
 */
import type { APIRoute } from 'astro'
import { getSecret } from 'astro:env/server'
import { Resend } from 'resend'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { checkContactRateLimit } from '@pages/api/_utils/rateLimit'

export const prerender = false // Force SSR for this endpoint

// Types
interface ContactFormData {
	name: string
	email: string
	phone?: string
	message: string
	consent?: boolean
	DataSubjectId?: string // Optional - will be generated if not provided
	service?: string
	budget?: string
	timeline?: string
	website?: string
}

interface FileAttachment {
	filename: string
	content: Buffer
	contentType: string
	size: number
}

interface EmailData {
	from: string
	to: string
	subject: string
	html: string
}

/**
 * Validate contact form input
 */
function validateInput(body: ContactFormData): string[] {
	const errors: string[] = []

	// Name validation
	if (!body.name?.trim()) {
		errors.push('Name is required')
	} else if (body.name.length < 2) {
		errors.push('Name must be at least 2 characters')
	} else if (body.name.length > 100) {
		errors.push('Name must be less than 100 characters')
	}

	// Email validation
	if (!body.email?.trim()) {
		errors.push('Email is required')
	} else {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(body.email)) {
			errors.push('Invalid email address')
		}
	}

	// Message validation
	if (!body.message?.trim()) {
		errors.push('Message is required')
	} else if (body.message.length < 10) {
		errors.push('Message must be at least 10 characters')
	} else if (body.message.length > 2000) {
		errors.push('Message must be less than 2000 characters')
	}

	// Check for spam patterns
	const spamPatterns = ['viagra', 'cialis', 'casino', 'poker', 'lottery']
	const messageContent = `${body.name} ${body.email} ${body.message}`.toLowerCase()
	if (spamPatterns.some((pattern) => messageContent.includes(pattern))) {
		errors.push('Message appears to contain spam')
	}

	return errors
}

/**
 * Generate HTML email content
 */
function generateEmailContent(data: ContactFormData, files: FileAttachment[]): string {
	const fields = [
		`<p><strong>Name:</strong> ${escapeHtml(data.name)}</p>`,
		`<p><strong>Email:</strong> ${escapeHtml(data.email)}</p>`,
	]

	if (data.phone) {
		fields.push(`<p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>`)
	}
	if (data.service) {
		fields.push(`<p><strong>Service:</strong> ${escapeHtml(data.service)}</p>`)
	}
	if (data.budget) {
		fields.push(`<p><strong>Budget:</strong> ${escapeHtml(data.budget)}</p>`)
	}
	if (data.timeline) {
		fields.push(`<p><strong>Timeline:</strong> ${escapeHtml(data.timeline)}</p>`)
	}
	if (data.website) {
		fields.push(`<p><strong>Website:</strong> ${escapeHtml(data.website)}</p>`)
	}

	fields.push(`<p><strong>Message:</strong></p>`)
	fields.push(`<p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>`)

	if (files.length > 0) {
		fields.push(`<p><strong>Attachments:</strong></p>`)
		fields.push('<ul>')
		files.forEach((file) => {
			fields.push(`<li>${escapeHtml(file.filename)} (${formatFileSize(file.size)})</li>`)
		})
		fields.push('</ul>')
	}

	fields.push(`<p><strong>Consent Given:</strong> ${data.consent ? 'Yes' : 'No'}</p>`)

	return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
p { margin: 10px 0; }
</style>
</head>
<body>
<h1>New Contact Form Submission</h1>
${fields.join('\n')}
</body>
</html>
`
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	}
	return text.replace(/[&<>"']/g, (char) => map[char] || char)
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Send email via Resend
 */
async function sendEmail(emailData: EmailData, files: FileAttachment[]): Promise<void> {
	// Skip actual email sending in dev/test environments
	if (getSecret('VITEST') || import.meta.env.DEV) {
		return // Skip actual email sending in dev/test
	}

	const apiKey = import.meta.env['RESEND_API_KEY']

	if (!apiKey) {
		throw new Error('Resend API key is not configured.')
	}

	const resend = new Resend(apiKey)

	try {
		// Prepare attachments for Resend
		const attachments = files.map((file) => ({
			filename: file.filename,
			content: file.content,
		}))

		const response = await resend.emails.send({
			from: emailData.from,
			to: emailData.to,
			subject: emailData.subject,
			html: emailData.html,
			...(attachments.length > 0 && { attachments }),
		})

		if (!response.data) {
			throw new Error(response.error?.message || 'Failed to send email')
		}
	} catch (error) {
		console.error('Resend API error:', error)
		throw new Error('Failed to send email. Please try again later.')
	}
}

/**
 * Main API handler for contact form submissions
 */
export const POST: APIRoute = async ({ request }) => {
	try {
		// Get client IP and user agent
		const ip =
			request.headers.get('x-forwarded-for')?.split(',')[0] ||
			request.headers.get('x-real-ip') ||
			'unknown'
		const userAgent = request.headers.get('user-agent') || 'unknown'

		// Check rate limit
		if (!checkContactRateLimit(ip)) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Too many form submissions. Please try again later.',
				}),
				{
					status: 429,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Parse request body
		const contentType = request.headers.get('content-type') || ''
		let formData: ContactFormData
		const files: FileAttachment[] = []

		if (contentType.includes('multipart/form-data')) {
			// Handle file uploads
			const form = await request.formData()
			formData = {
				name: form.get('name') as string,
				email: form.get('email') as string,
				message: form.get('message') as string,
				consent: form.get('consent') === 'true',
			}

			// Add optional fields if present
			const phone = form.get('phone') as string
			const service = form.get('service') as string
			const budget = form.get('budget') as string
			const timeline = form.get('timeline') as string
			const website = form.get('website') as string

			if (phone) formData.phone = phone
			if (service) formData.service = service
			if (budget) formData.budget = budget
			if (timeline) formData.timeline = timeline
			if (website) formData.website = website

			// Process file attachments
			const allowedTypes = [
				'image/jpeg',
				'image/png',
				'image/gif',
				'application/pdf',
				'application/msword',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			]
			const maxFileSize = 10 * 1024 * 1024 // 10MB
			const maxFiles = 5

			let fileCount = 0
			for (const [key, value] of form.entries()) {
				if (key.startsWith('file') && value instanceof File && value.size > 0) {
					fileCount++

					if (fileCount > maxFiles) {
						return new Response(
							JSON.stringify({
								success: false,
								error: `Maximum ${maxFiles} files allowed`,
							}),
							{
								status: 400,
								headers: { 'Content-Type': 'application/json' },
							},
						)
					}

					if (value.size > maxFileSize) {
						return new Response(
							JSON.stringify({
								success: false,
								error: `File ${value.name} exceeds 10MB limit`,
							}),
							{
								status: 400,
								headers: { 'Content-Type': 'application/json' },
							},
						)
					}

					if (!allowedTypes.includes(value.type)) {
						return new Response(
							JSON.stringify({
								success: false,
								error: `File type ${value.type} not allowed`,
							}),
							{
								status: 400,
								headers: { 'Content-Type': 'application/json' },
							},
						)
					}

					const buffer = Buffer.from(await value.arrayBuffer())
					files.push({
						filename: value.name,
						content: buffer,
						contentType: value.type,
						size: value.size,
					})
				}
			}
		} else {
			// Handle JSON request
			formData = (await request.json()) as ContactFormData
		}

		// Validate input
		const errors = validateInput(formData)
		if (errors.length > 0) {
			return new Response(
				JSON.stringify({
					success: false,
					error: errors[0],
					errors,
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Record GDPR consent (optional for contact form)
		if (formData.consent) {
			// Generate or validate DataSubjectId
			let subjectId = formData.DataSubjectId
			if (!subjectId) {
				subjectId = uuidv4()
			} else if (!uuidValidate(subjectId)) {
				return new Response(
					JSON.stringify({
						success: false,
						error: 'Invalid DataSubjectId format',
					}),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					},
				)
			}

			// Record consent via new GDPR API
			const consentResponse = await fetch(`${new URL(request.url).origin}/api/gdpr/consent`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					DataSubjectId: subjectId,
					email: formData.email,
					purposes: ['contact'],
					source: 'contact_form',
					userAgent,
					...(ip !== 'unknown' && { ipAddress: ip }),
					verified: true, // Contact form consent is immediately verified
				}),
			})

			if (!consentResponse.ok) {
				console.error('Failed to record consent:', await consentResponse.json())
				// Continue anyway - don't block form submission on consent logging failure
			}
		}

		// Generate email content
		const htmlContent = generateEmailContent(formData, files)

		// Send email via Resend
		const emailData: EmailData = {
			from: 'contact@webstackbuilders.com',
			to: 'info@webstackbuilders.com',
			subject: `Contact Form: ${formData.name}`,
			html: htmlContent,
		}

		await sendEmail(emailData, files)

		// Return success response
		return new Response(
			JSON.stringify({
				success: true,
				message: 'Thank you for your message. We will get back to you soon!',
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		console.error('Contact form error:', error)

		const errorMessage =
			error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'

		return new Response(
			JSON.stringify({
				success: false,
				error: errorMessage,
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}
}

// Handle OPTIONS for CORS
export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	})
}
