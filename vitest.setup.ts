/**
 * Vitest setup file for test environment configuration
 * This file runs before all test files
 */
import { expect } from 'vitest'
import { toHaveInProtoChain, toBeNil, toBeObject } from '@test/unit/matchers/assertions'

// Configure happy-dom to silence JavaScript loading warnings
// This prevents "Failed to load module" errors when testing Astro components with <script> tags
interface HappyDOMWindow extends Window {
  happyDOM?: {
    settings: {
      disableJavaScriptFileLoading: boolean
      handleDisabledFileLoadingAsSuccess: boolean
    }
  }
}

if (typeof window !== 'undefined' && (window as HappyDOMWindow).happyDOM) {
  const happyWindow = window as HappyDOMWindow
  happyWindow.happyDOM!.settings.disableJavaScriptFileLoading = true
  happyWindow.happyDOM!.settings.handleDisabledFileLoadingAsSuccess = true
}

// Fix esbuild TextEncoder issue for Astro Container API
// See: https://github.com/withastro/astro/issues/8755
Object.defineProperty(globalThis, 'TextEncoder', {
  value: TextEncoder,
  writable: true,
})

Object.defineProperty(globalThis, 'TextDecoder', {
  value: TextDecoder,
  writable: true,
})


// Try to load axe matchers if available
try {
  // Use dynamic import to avoid TypeScript/linting issues
  import('vitest-axe/matchers').then((axeMatchers) => {
    expect.extend(axeMatchers)
  }).catch(() => {
    // Axe matchers not available, continue without them
  })
} catch {
  // Axe matchers not available, continue without them
}

// Extend vitest's expect with custom matchers
expect.extend({
  toHaveInProtoChain,
  toBeNil,
  toBeObject
})
