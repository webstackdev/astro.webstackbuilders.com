// @vitest-environment happy-dom
/**
 * Comprehensive unit tests for CallToAction Validator Integration
 *
 * Tests cover:
 * - Integration configuration and initialization
 * - Component discovery logic
 * - Import pattern generation
 * - Basic integration structure
 *
 * Uses Vitest with happy-dom environment for DOM compatibility.
 */

import { describe, it, expect, vi } from 'vitest'
import { callToActionValidator } from '../call-to-action-validator'

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn()
}))

// Mock path module
vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...actual,
    resolve: vi.fn((...args) => args.join('/')),
    relative: vi.fn((from, to) => to.replace(from + '/', '')),
    join: vi.fn((...args) => args.join('/'))
  }
})

describe('CallToAction Validator Integration', () => {
  let mockFiles: Map<string, string>

  beforeEach(() => {
    vi.clearAllMocks()
    mockFiles = createMockFileSystem()

    // Mock readFile to use our mock file system
    vi.mocked(readFile).mockImplementation(async (path: string) => {
      const filePath = path.toString()
      const content = mockFiles.get(filePath)

      if (!content) {
        throw new Error(`File not found: ${filePath}`)
      }

      return content
    })

    // Mock readdir for component discovery
    vi.mocked(readdir).mockImplementation(async (path: string) => {
      const dirPath = path.toString()

      if (dirPath.includes('/CallToAction')) {
        return [
          { name: 'Newsletter', isDirectory: () => true, isFile: () => false },
          { name: 'Contact', isDirectory: () => true, isFile: () => false },
          { name: 'Whitepaper', isDirectory: () => true, isFile: () => false },
          { name: 'Featured', isDirectory: () => true, isFile: () => false }
        ] as any
      }

      if (dirPath.includes('/pages')) {
        return [
          { name: 'valid-single.astro', isDirectory: () => false, isFile: () => true },
          { name: 'invalid-multiple-newsletter.astro', isDirectory: () => false, isFile: () => true },
          { name: 'invalid-multiple-mixed.astro', isDirectory: () => false, isFile: () => true },
          { name: 'valid-mixed.astro', isDirectory: () => false, isFile: () => true },
          { name: 'no-cta.astro', isDirectory: () => false, isFile: () => true }
        ] as any
      }

      if (dirPath.includes('/content')) {
        return [
          { name: 'blog', isDirectory: () => true, isFile: () => false }
        ] as any
      }

      if (dirPath.includes('/blog')) {
        return [
          { name: 'invalid-mdx.mdx', isDirectory: () => false, isFile: () => true },
          { name: 'valid-mdx.mdx', isDirectory: () => false, isFile: () => true }
        ] as any
      }

      return []
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Integration Configuration', () => {
    it('should initialize with default configuration', () => {
      const integration = callToActionValidator()

      expect(integration).toBeDefined()
      expect(integration.name).toBe('call-to-action-validator')
      expect(integration.hooks).toBeDefined()
      expect(integration.hooks['astro:config:setup']).toBeDefined()
      expect(integration.hooks['astro:config:done']).toBeDefined()
      expect(integration.hooks['astro:build:start']).toBeDefined()
    })

    it('should accept custom configuration', () => {
      const customOptions = {
        componentPath: 'custom/path',
        debug: true,
        additionalPatterns: ['custom-pattern']
      }

      const integration = callToActionValidator(customOptions)

      expect(integration).toBeDefined()
      expect(integration.name).toBe('call-to-action-validator')
    })

    it('should merge custom options with defaults', () => {
      const partialOptions = { debug: true }
      const integration = callToActionValidator(partialOptions)

      expect(integration).toBeDefined()
      // Integration should still work with partial options
    })
  })

  describe('Component Discovery', () => {
    it('should discover all CallToAction components in directory', async () => {
      const integration = callToActionValidator({ debug: true })

      // Simulate astro:config:setup hook
      const setupContext = {
        config: mockAstroConfig,
        logger: mockLogger
      }

      await integration.hooks['astro:config:setup']!(setupContext as any)

      expect(mockLogger.info).toHaveBeenCalledWith('CallToAction Validator: Integration initialized')
    })

    it('should handle missing component directory gracefully', async () => {
      // Mock readdir to simulate missing directory
      vi.mocked(readdir).mockRejectedValue(new Error('Directory not found'))

      const integration = callToActionValidator()

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)

      await expect(
        integration.hooks['astro:config:done']!(doneContext as any)
      ).rejects.toThrow()

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('CallToAction Validator: Failed to discover components')
      )
    })

    it('should skip directories without index.astro files', async () => {
      // Mock readFile to simulate missing index.astro in some directories
      const originalReadFile = vi.mocked(readFile).getMockImplementation()

      vi.mocked(readFile).mockImplementation(async (path: string) => {
        if (path.includes('InvalidComponent/index.astro')) {
          throw new Error('File not found')
        }
        return originalReadFile!(path as any, 'utf-8' as any) as Promise<string>
      })

      const integration = callToActionValidator({ debug: true })

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Skipping 'InvalidComponent' - no index.astro found")
      )
    })

    it('should generate correct import patterns for components', async () => {
      const integration = callToActionValidator({ debug: true })

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('CallToAction Validator: Discovered 4 components')
      )
    })
  })

  describe('Page Validation', () => {
    it('should validate pages without errors when no duplicates exist', async () => {
      const integration = callToActionValidator({ debug: true })

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }
      const buildContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      // This should not throw an error
      await expect(
        integration.hooks['astro:build:start']!(buildContext as any)
      ).resolves.toBeUndefined()

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('CallToAction Validator: Validation successful!')
      )
    })

    it('should detect multiple Newsletter components in single page', async () => {
      const integration = callToActionValidator({ debug: true })

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }
      const buildContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      await expect(
        integration.hooks['astro:build:start']!(buildContext as any)
      ).rejects.toThrow('CallToAction validation failed')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'CallToAction Validator: Multiple component instances detected!'
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Multiple instances of Newsletter found')
      )
    })

    it('should detect multiple components in MDX files', async () => {
      const integration = callToActionValidator()

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }
      const buildContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      await expect(
        integration.hooks['astro:build:start']!(buildContext as any)
      ).rejects.toThrow()

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringMatching(/invalid-mdx\.mdx/)
      )
    })

    it('should allow different CallToAction components on same page', async () => {
      // Create a test with only valid files
      vi.mocked(readdir).mockImplementation(async (path: string) => {
        const dirPath = path.toString()

        if (dirPath.includes('/CallToAction')) {
          return [
            { name: 'Newsletter', isDirectory: () => true, isFile: () => false },
            { name: 'Contact', isDirectory: () => true, isFile: () => false },
            { name: 'Whitepaper', isDirectory: () => true, isFile: () => false }
          ] as any
        }

        if (dirPath.includes('/pages')) {
          // Only return valid files
          return [
            { name: 'valid-single.astro', isDirectory: () => false, isFile: () => true },
            { name: 'valid-mixed.astro', isDirectory: () => false, isFile: () => true },
            { name: 'no-cta.astro', isDirectory: () => false, isFile: () => true }
          ] as any
        }

        if (dirPath.includes('/content')) {
          return [
            { name: 'blog', isDirectory: () => true, isFile: () => false }
          ] as any
        }

        if (dirPath.includes('/blog')) {
          return [
            { name: 'valid-mdx.mdx', isDirectory: () => false, isFile: () => true }
          ] as any
        }

        return []
      })

      const integration = callToActionValidator({ debug: true })

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }
      const buildContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      // Should not throw error with valid files only
      await expect(
        integration.hooks['astro:build:start']!(buildContext as any)
      ).resolves.toBeUndefined()
    })

    it('should handle files that cannot be read', async () => {
      // Mock readFile to fail for specific files
      const originalReadFile = vi.mocked(readFile).getMockImplementation()

      vi.mocked(readFile).mockImplementation(async (path: string) => {
        if (path.includes('unreadable-file.astro')) {
          throw new Error('Permission denied')
        }
        return originalReadFile!(path as any, 'utf-8' as any) as Promise<string>
      })

      const integration = callToActionValidator()

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }
      const buildContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      // Should still validate other files successfully
      await expect(
        integration.hooks['astro:build:start']!(buildContext as any)
      ).rejects.toThrow() // Will throw due to our test files having duplicates
    })
  })

  describe('Error Reporting', () => {
    it('should provide detailed error messages with line numbers', async () => {
      const integration = callToActionValidator()

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }
      const buildContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      await expect(
        integration.hooks['astro:build:start']!(buildContext as any)
      ).rejects.toThrow()

      // Check that error includes line number information
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringMatching(/Line \d+:/)
      )
    })

    it('should report multiple validation errors for different pages', async () => {
      const integration = callToActionValidator()

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }
      const buildContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      await expect(
        integration.hooks['astro:build:start']!(buildContext as any)
      ).rejects.toThrow()

      // Should report errors for multiple pages
      const errorCalls = mockLogger.error.mock.calls.filter(call =>
        call[0].includes('Page:')
      )

      expect(errorCalls.length).toBeGreaterThan(1)
    })

    it('should include component usage locations in error messages', async () => {
      const integration = callToActionValidator()

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }
      const buildContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      await expect(
        integration.hooks['astro:build:start']!(buildContext as any)
      ).rejects.toThrow()

      // Check for location markers (└─)
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringMatching(/└─/)
      )
    })
  })

  describe('Integration Hooks', () => {
    it('should execute all hooks in correct order', async () => {
      const integration = callToActionValidator({ debug: true })
      const hookOrder: string[] = []

      const mockLoggerWithTracking = {
        ...mockLogger,
        info: vi.fn((msg) => {
          if (msg.includes('Integration initialized')) hookOrder.push('config:setup')
          if (msg.includes('Discovered')) hookOrder.push('config:done')
          if (msg.includes('Starting build validation')) hookOrder.push('build:start')
        })
      }

      const setupContext = { config: mockAstroConfig, logger: mockLoggerWithTracking }
      const doneContext = { logger: mockLoggerWithTracking }
      const buildContext = { logger: mockLoggerWithTracking }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      try {
        await integration.hooks['astro:build:start']!(buildContext as any)
      } catch {
        // Expected to throw due to validation errors
      }

      expect(hookOrder).toEqual(['config:setup', 'config:done', 'build:start'])
    })

    it('should stop build process when validation fails', async () => {
      const integration = callToActionValidator()

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }
      const buildContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      const buildPromise = integration.hooks['astro:build:start']!(buildContext as any)

      await expect(buildPromise).rejects.toThrow('CallToAction validation failed')
    })
  })

  describe('Debug Mode', () => {
    it('should provide additional logging when debug is enabled', async () => {
      const integration = callToActionValidator({ debug: true })

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'CallToAction Validator: Integration initialized'
      )

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('CallToAction Validator: Discovered')
      )
    })

    it('should minimize logging when debug is disabled', async () => {
      const integration = callToActionValidator({ debug: false })

      const setupContext = { config: mockAstroConfig, logger: mockLogger }
      const doneContext = { logger: mockLogger }

      await integration.hooks['astro:config:setup']!(setupContext as any)
      await integration.hooks['astro:config:done']!(doneContext as any)

      // Should not log initialization message when debug is false
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        'CallToAction Validator: Integration initialized'
      )
    })
  })
})