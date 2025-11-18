/**
 * API endpoint for download form submissions
 */
import type { APIRoute } from 'astro'

export const prerender = false

interface DownloadFormData {
  firstName: string
  lastName: string
  workEmail: string
  jobTitle: string
  companyName: string
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: DownloadFormData = await request.json()

    // Validate required fields
    if (
      !data.firstName ||
      !data.lastName ||
      !data.workEmail ||
      !data.jobTitle ||
      !data.companyName
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'All fields are required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.workEmail)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid email address',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // TODO: Integrate with email service (e.g., SendGrid, Mailchimp, HubSpot)
    // TODO: Store submission in database or CRM
    // For now, just log the submission
    console.log('Download form submission:', {
      name: `${data.firstName} ${data.lastName}`,
      email: data.workEmail,
      jobTitle: data.jobTitle,
      company: data.companyName,
      timestamp: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Form submitted successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error processing download form:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
