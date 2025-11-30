declare module 'astro-vtbot' {
  import type { AstroIntegration } from 'astro'

  interface VtbotOptions {
    [key: string]: unknown
  }

  const vtbot: (_options?: VtbotOptions) => AstroIntegration
  export default vtbot
}
