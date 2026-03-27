import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next()
  const contentType = response.headers.get('content-type')

  if (!contentType || !contentType.startsWith('text/html') || /charset=/i.test(contentType)) {
    return response
  }

  const headers = new Headers(response.headers)
  headers.set('content-type', `${contentType}; charset=utf-8`)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
})