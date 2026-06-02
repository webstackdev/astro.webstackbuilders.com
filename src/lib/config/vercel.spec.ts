import { describe, expect, it } from 'vitest'
import { vercelConfig } from './vercel'

describe('vercelConfig', () => {
  it('includes CanvasKit server assets for social card generation', () => {
    expect(vercelConfig.includeFiles).toContain('node_modules/canvaskit-wasm/bin/full/canvaskit.wasm')
  })
})