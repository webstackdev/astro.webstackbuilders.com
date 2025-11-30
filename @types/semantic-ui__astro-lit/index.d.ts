import type { AstroIntegration, AstroRenderer } from 'astro'

declare module '@semantic-ui/astro-lit' {
  export function getContainerRenderer(): AstroRenderer
  export default function litIntegration(): AstroIntegration
}
