/**
 * API endpoint to generate social media cards using HTML template
 * This returns HTML that can be screenshot by external services or used in OG tags
 * Usage: GET /api/social-card?slug=article-title&title=Article Title&description=Article description
 */
import type { APIRoute } from 'astro'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import { createApiFunctionContext } from '@pages/api/_utils/requestContext'

export const prerender = false

const ROUTE = '/api/social-card'

export const GET: APIRoute = async ({ request, clientAddress, cookies }) => {
  const { context: apiContext } = createApiFunctionContext({
    route: ROUTE,
    operation: 'GET',
    request,
    clientAddress,
    cookies,
  })

  try {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug') || 'home'
    const title = url.searchParams.get('title') || 'Webstack Builders'
    const description = url.searchParams.get('description') || 'Professional Web Development Services'
    const date = url.searchParams.get('date') || new Date().toLocaleDateString()
    const format = url.searchParams.get('format') || 'html' // html or og

    // If requesting Open Graph meta tags
    if (format === 'og') {
      const imageUrl = `${url.origin}/api/social-card?slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&format=html`

      return new Response(
        JSON.stringify({
          'og:title': title,
          'og:description': description,
          'og:image': imageUrl,
          'og:url': `${url.origin}/${slug}`,
          'twitter:card': 'summary_large_image',
          'twitter:title': title,
          'twitter:description': description,
          'twitter:image': imageUrl,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
          },
        }
      )
    }

    // HTML template for social card (can be screenshot by external services)
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500&display=swap" rel="stylesheet" />
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            width: 1200px;
            height: 630px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 60px;
            background: linear-gradient(135deg, #001a39 0%, #006dca 100%);
            color: white;
            font-family: "Baloo 2", "Onest Regular", sans-serif;
            box-sizing: border-box;
            overflow: hidden;
          }

          .card-content {
            text-align: center;
            max-width: 1000px;
            z-index: 2;
          }

          h1 {
            font-size: 4rem;
            margin-bottom: 2rem;
            line-height: 1.1;
            font-weight: 500;
            color: white;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }

          p {
            font-size: 2rem;
            line-height: 1.4;
            margin-bottom: 1rem;
            opacity: 0.9;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          }

          .date {
            font-size: 1.5rem;
            opacity: 0.8;
            font-style: italic;
          }

          .brand {
            position: absolute;
            bottom: 40px;
            right: 40px;
            font-size: 1.8rem;
            font-weight: bold;
            opacity: 0.8;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          }

          /* Decorative elements */
          .decoration {
            position: absolute;
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            top: -100px;
            left: -100px;
          }

          .decoration:nth-child(2) {
            width: 150px;
            height: 150px;
            top: auto;
            bottom: -75px;
            right: -75px;
            left: auto;
            background: rgba(255,255,255,0.05);
          }
        </style>
      </head>
      <body>
        <div class="decoration"></div>
        <div class="decoration"></div>
        <div class="card-content">
          <h1>${title}</h1>
          <p>${description}</p>
          ${date ? `<div class="date">Published on ${date}</div>` : ''}
        </div>
        <div class="brand">Webstack Builders</div>
      </body>
    </html>
  `

    return new Response(htmlTemplate, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    return buildApiErrorResponse(handleApiFunctionError(error, apiContext), {
      fallbackMessage: 'Unable to generate social card',
    })
  }
}
