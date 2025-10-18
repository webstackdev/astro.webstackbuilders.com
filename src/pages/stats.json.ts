/**
 * Add stats global data keys
 *
 * @returns Keys for timestamp and env
 */
export function GET() {
  return new Response(
    JSON.stringify({
      timestamp: Date(),
      env: import.meta.env.MODE,
    })
  )
}
