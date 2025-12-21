/**
 * Mock for Astro transitions client module
 * Used in unit tests where Astro's transition API isn't available
 */
import { vi } from 'vitest'

export const navigate = vi.fn().mockImplementation((_url: string | URL) => {
  // Mock navigation - just resolve immediately
  return Promise.resolve()
})
