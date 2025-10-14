import { describe, it, expect, vi } from 'vitest'

/**
 * Unit tests for Newsletter API Entry Point
 *
 * Tests cover:
 * - Default export functionality
 * - Handler delegation to newsletter module
 * - Vercel function compatibility
 *
 * Note: This tests the entry point that Vercel uses to invoke the newsletter handler
 */

describe('Newsletter API Entry Point', () => {
  it('should export the newsletter handler as default', async () => {
    // Import the index module
    const indexModule = await import('../index')

    // Import the newsletter module to compare
    const newsletterModule = await import('../newsletter')

    // The default export from index should be the same as the default export from newsletter
    expect(indexModule.default).toBe(newsletterModule.default)
  })

  it('should be a function', async () => {
    const indexModule = await import('../index')
    expect(typeof indexModule.default).toBe('function')
  })

  it('should delegate to newsletter handler', async () => {
    // Since index.ts just re-exports the newsletter handler,
    // we can test that the import chain works correctly
    const indexModule = await import('../index')
    const newsletterModule = await import('../newsletter')

    // Both should reference the same function
    expect(indexModule.default).toBe(newsletterModule.default)

    // Test that calling the index handler works
    const mockReq = {
      method: 'OPTIONS', // Use OPTIONS to avoid complex mocking
    }

    const mockRes = {
      setHeader: vi.fn(),
      status: vi.fn(() => mockRes),
      json: vi.fn(() => mockRes),
      end: vi.fn(() => mockRes),
    }

    // Call the handler from index
    await indexModule.default(mockReq, mockRes)

    // Should handle OPTIONS request properly
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.end).toHaveBeenCalled()
  })

  it('should maintain function signature compatibility', async () => {
    // This test ensures the exported function has the expected signature
    // for Vercel serverless functions
    const module = await import('../index')
    const handler = module.default

    expect(handler).toBeDefined()
    expect(typeof handler).toBe('function')
    expect(handler.length).toBe(2) // Should accept 2 parameters (req, res)
  })
})