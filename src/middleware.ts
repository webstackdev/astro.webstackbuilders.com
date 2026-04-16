import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
  if (!import.meta.env.DEV && context.url.pathname.startsWith('/testing')) {
    return new Response('Not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    })
  }

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