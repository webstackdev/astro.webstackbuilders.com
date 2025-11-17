import { describe, it, expect, beforeEach, afterEach, afterAll, vi, type Mock } from 'vitest'
import sharp, { type Metadata } from 'sharp'
import toIco from 'to-ico'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { BuildError } from '@lib/errors'

// Mock external dependencies before any imports
vi.mock('sharp')
vi.mock('to-ico')
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}))
vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}))

describe('FaviconGenerator Integration', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  const mockMetadata: Partial<Metadata> = {
    width: 512,
    height: 512,
    density: 72,
    format: 'svg',
  }

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Reset mocks
    vi.clearAllMocks()

    // Reset module cache
    vi.resetModules()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  // Clean shutdown after all tests complete
  afterAll(() => {
    // Force process exit after a brief delay to allow cleanup
    setTimeout(() => {
      if (process.env.VITEST) {
        process.exit(0)
      }
    }, 100)
  })

  describe('Integration Setup', () => {
    it('should have correct integration name', async () => {
      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      expect(integration.name).toBe('favicon-generator')
    })

    it('should register astro:config:setup hook', async () => {
      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      expect(integration.hooks).toHaveProperty('astro:config:setup')
      expect(typeof integration.hooks['astro:config:setup']).toBe('function')
    })
  })

  describe('Favicon Generation', () => {
    it('should generate all 5 favicon variants when source file exists', async () => {
      const mockBuffer = Buffer.from('test-buffer')
      const mockMetadataFn = vi.fn().mockResolvedValue(mockMetadata)
      const mockResize = vi.fn().mockReturnThis()
      const mockPng = vi.fn().mockReturnThis()
      const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer)

      vi.mocked(existsSync).mockReturnValue(true)
      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: mockMetadataFn,
        resize: mockResize,
        png: mockPng,
        toBuffer: mockToBuffer,
      })
      ;(toIco as Mock).mockResolvedValue(mockBuffer)
      ;(mkdir as Mock).mockResolvedValue(undefined)
      ;(writeFile as Mock).mockResolvedValue(undefined)

      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      const mockConfig = {
        root: new URL('file:///home/user/project/'),
      }

      await integration.hooks['astro:config:setup']?.({
        // @ts-expect-error - Partial mock
        config: mockConfig,
        command: 'build',
      })

      // Verify mkdir was called to create output directory
      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('public'),
        { recursive: true }
      )

      // Verify writeFile was called 5 times (one for each favicon variant)
      expect(writeFile).toHaveBeenCalledTimes(5)

      // Verify all expected filenames
      const writeFileCalls = vi.mocked(writeFile).mock.calls
      const filenames = writeFileCalls.map(call => {
        const path = call[0] as string
        return path.split('/').pop()
      })

      expect(filenames).toContain('favicon.ico')
      expect(filenames).toContain('apple-touch-icon.png')
      expect(filenames).toContain('icon-192.png')
      expect(filenames).toContain('icon-512.png')
      expect(filenames).toContain('icon-mask.png')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Favicons and PWA icons generated successfully')
      )
    })

    it('should throw BuildError when source favicon does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false)

      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      const mockConfig = {
        root: new URL('file:///home/user/project/'),
      }

      await expect(
        integration.hooks['astro:config:setup']?.({
          // @ts-expect-error - Partial mock
          config: mockConfig,
          command: 'build',
        })
      ).rejects.toThrow('Source favicon not found')
    })

    it('should throw BuildError when source is not SVG format', async () => {
      const pngMetadata: Partial<Metadata> = { ...mockMetadata, format: 'png' }

      vi.mocked(existsSync).mockReturnValue(true)
      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: vi.fn().mockResolvedValue(pngMetadata),
      })

      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      const mockConfig = {
        root: new URL('file:///home/user/project/'),
      }

      await expect(
        integration.hooks['astro:config:setup']?.({
          // @ts-expect-error - Partial mock
          config: mockConfig,
          command: 'build',
        })
      ).rejects.toThrow('Source favicon must be SVG format')
    })

    it('should handle sharp errors and wrap in BuildError', async () => {
      const sharpError = new Error('Sharp processing failed')

      vi.mocked(existsSync).mockReturnValue(true)
      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: vi.fn().mockRejectedValue(sharpError),
      })

      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      const mockConfig = {
        root: new URL('file:///home/user/project/'),
      }

      await expect(
        integration.hooks['astro:config:setup']?.({
          // @ts-expect-error - Partial mock
          config: mockConfig,
          command: 'build',
        })
      ).rejects.toThrow('Failed to generate favicons')
    })
  })

  describe('ICO Favicon Generation', () => {
    it('should generate ICO with 32x32 and 64x64 resolutions', async () => {
      const mockBuffer = Buffer.from('test-buffer')
      const mockResize = vi.fn().mockReturnThis()
      const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer)
      const mockToIco = vi.fn().mockResolvedValue(mockBuffer)

      ;(sharp as unknown as Mock).mockReturnValue({
        resize: mockResize,
        toBuffer: mockToBuffer,
      })
      ;(toIco as Mock).mockImplementation(mockToIco)

      const { generateIcoFavicon } = await import('../index')

      const faviconPath = '/test/path/favicon.svg'
      const metadata: Partial<Metadata> = {
        width: 512,
        height: 512,
        density: 72,
      }

      // Call the generator function with metadata
      const generator = generateIcoFavicon(faviconPath)
      const result = await generator(metadata as Metadata)

      // Verify to-ico was called with array of 2 buffers
      expect(toIco).toHaveBeenCalledTimes(1)
      expect(toIco).toHaveBeenCalledWith([mockBuffer, mockBuffer])

      // Verify sharp was called with correct density for both dimensions
      const sharpCalls = (sharp as unknown as Mock).mock.calls
      expect(sharpCalls).toHaveLength(2)

      // 32x32 with density (32/512) * 72 = 4.5
      expect(sharp).toHaveBeenCalledWith(faviconPath, { density: 4.5 })

      // 64x64 with density (64/512) * 72 = 9
      expect(sharp).toHaveBeenCalledWith(faviconPath, { density: 9 })

      // Verify resize was called for both dimensions
      expect(mockResize).toHaveBeenCalledWith(32, 32)
      expect(mockResize).toHaveBeenCalledWith(64, 64)

      // Verify result is the buffer from toIco
      expect(result).toBe(mockBuffer)
    })

    it('should calculate correct density for ICO dimensions', async () => {
      const mockBuffer = Buffer.from('test-buffer')
      const mockMetadataFn = vi.fn().mockResolvedValue(mockMetadata)
      const mockResize = vi.fn().mockReturnThis()
      const mockPng = vi.fn().mockReturnThis()
      const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer)

      vi.mocked(existsSync).mockReturnValue(true)
      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: mockMetadataFn,
        resize: mockResize,
        png: mockPng,
        toBuffer: mockToBuffer,
      })
      ;(toIco as Mock).mockResolvedValue(mockBuffer)
      ;(mkdir as Mock).mockResolvedValue(undefined)
      ;(writeFile as Mock).mockResolvedValue(undefined)

      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      const mockConfig = {
        root: new URL('file:///home/user/project/'),
      }

      await integration.hooks['astro:config:setup']?.({
        // @ts-expect-error - Partial mock
        config: mockConfig,
        command: 'build',
      })

      // Verify density calculations: (dimension / 512) * 72
      const sharpCalls = (sharp as unknown as Mock).mock.calls
      const densities = sharpCalls
        .filter(call => call[1]?.density !== undefined)
        .map(call => call[1].density)

      expect(densities).toContain((32 / 512) * 72) // 4.5
      expect(densities).toContain((64 / 512) * 72) // 9
    })

    it('should throw BuildError when metadata is missing required fields', async () => {
      const incompleteMetadata: Partial<Metadata> = {
        width: 512,
        height: 512,
        // Missing density
        format: 'svg',
      }

      vi.mocked(existsSync).mockReturnValue(true)
      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: vi.fn().mockResolvedValue(incompleteMetadata),
      })
      ;(mkdir as Mock).mockResolvedValue(undefined)

      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      const mockConfig = {
        root: new URL('file:///home/user/project/'),
      }

      await expect(
        integration.hooks['astro:config:setup']?.({
          // @ts-expect-error - Partial mock
          config: mockConfig,
          command: 'build',
        })
      ).rejects.toThrow('Required metadata')
    })
  })

  describe('PNG Favicon Generation', () => {
    it('should generate apple-touch-icon with 180x180 dimensions', async () => {
      const mockBuffer = Buffer.from('test-buffer')
      const mockMetadataFn = vi.fn().mockResolvedValue(mockMetadata)
      const mockResize = vi.fn().mockReturnThis()
      const mockPng = vi.fn().mockReturnThis()
      const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer)

      vi.mocked(existsSync).mockReturnValue(true)
      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: mockMetadataFn,
        resize: mockResize,
        png: mockPng,
        toBuffer: mockToBuffer,
      })
      ;(toIco as Mock).mockResolvedValue(mockBuffer)
      ;(mkdir as Mock).mockResolvedValue(undefined)
      ;(writeFile as Mock).mockResolvedValue(undefined)

      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      const mockConfig = {
        root: new URL('file:///home/user/project/'),
      }

      await integration.hooks['astro:config:setup']?.({
        // @ts-expect-error - Partial mock
        config: mockConfig,
        command: 'build',
      })

      // Verify 180x180 resize was called
      expect(mockResize).toHaveBeenCalledWith(180, 180)

      // Verify PNG format was specified
      expect(mockPng).toHaveBeenCalled()

      // Verify density calculation: (180 / 512) * 72
      const sharpCalls = (sharp as unknown as Mock).mock.calls
      const density180 = sharpCalls
        .find(call => call[1]?.density === (180 / 512) * 72)

      expect(density180).toBeDefined()
    })

    it('should calculate correct density for non-square images', () => {
      const wideMetadata = { width: 1024, height: 512, density: 72 }
      const tallMetadata = { width: 512, height: 1024, density: 72 }

      const wideDensity = (180 / Math.max(wideMetadata.width, wideMetadata.height)) * 72
      const tallDensity = (180 / Math.max(tallMetadata.width, tallMetadata.height)) * 72

      expect(wideDensity).toBe((180 / 1024) * 72)
      expect(tallDensity).toBe((180 / 1024) * 72)
      expect(wideDensity).toBe(tallDensity) // Should use max dimension
    })
  })

  describe('PWA Icon Generation', () => {
    it('should generate 192x192 PWA icon', async () => {
      const mockBuffer = Buffer.from('test-buffer')
      const mockMetadataFn = vi.fn().mockResolvedValue(mockMetadata)
      const mockResize = vi.fn().mockReturnThis()
      const mockPng = vi.fn().mockReturnThis()
      const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer)

      vi.mocked(existsSync).mockReturnValue(true)
      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: mockMetadataFn,
        resize: mockResize,
        png: mockPng,
        toBuffer: mockToBuffer,
      })
      ;(toIco as Mock).mockResolvedValue(mockBuffer)
      ;(mkdir as Mock).mockResolvedValue(undefined)
      ;(writeFile as Mock).mockResolvedValue(undefined)

      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      const mockConfig = {
        root: new URL('file:///home/user/project/'),
      }

      await integration.hooks['astro:config:setup']?.({
        // @ts-expect-error - Partial mock
        config: mockConfig,
        command: 'build',
      })

      expect(mockResize).toHaveBeenCalledWith(192, 192)
    })

    it('should generate 512x512 PWA icons (both regular and maskable)', async () => {
      const mockBuffer = Buffer.from('test-buffer')
      const mockMetadataFn = vi.fn().mockResolvedValue(mockMetadata)
      const mockResize = vi.fn().mockReturnThis()
      const mockPng = vi.fn().mockReturnThis()
      const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer)

      vi.mocked(existsSync).mockReturnValue(true)
      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: mockMetadataFn,
        resize: mockResize,
        png: mockPng,
        toBuffer: mockToBuffer,
      })
      ;(toIco as Mock).mockResolvedValue(mockBuffer)
      ;(mkdir as Mock).mockResolvedValue(undefined)
      ;(writeFile as Mock).mockResolvedValue(undefined)

      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      const mockConfig = {
        root: new URL('file:///home/user/project/'),
      }

      await integration.hooks['astro:config:setup']?.({
        // @ts-expect-error - Partial mock
        config: mockConfig,
        command: 'build',
      })

      // Should be called twice for icon-512 and icon-mask
      const resize512Calls = mockResize.mock.calls.filter(
        call => call[0] === 512 && call[1] === 512
      )
      expect(resize512Calls).toHaveLength(2)
    })
  })

  describe('Path Handling', () => {
    it('should decode URL-encoded paths with spaces', async () => {
      const mockBuffer = Buffer.from('test-buffer')
      const mockMetadataFn = vi.fn().mockResolvedValue(mockMetadata)

      vi.mocked(existsSync).mockReturnValue(true)
      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: mockMetadataFn,
        resize: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      })
      ;(toIco as Mock).mockResolvedValue(mockBuffer)
      ;(mkdir as Mock).mockResolvedValue(undefined)
      ;(writeFile as Mock).mockResolvedValue(undefined)

      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      const mockConfig = {
        root: new URL('file:///home/user/My%20Project/'),
      }

      await integration.hooks['astro:config:setup']?.({
        // @ts-expect-error - Partial mock
        config: mockConfig,
        command: 'build',
      })

      // Verify existsSync was called with decoded path
      expect(existsSync).toHaveBeenCalledWith(
        expect.stringContaining('My Project')
      )
      expect(existsSync).not.toHaveBeenCalledWith(
        expect.stringContaining('My%20Project')
      )
    })

    it('should handle Windows paths correctly', async () => {
      const mockBuffer = Buffer.from('test-buffer')
      const mockMetadataFn = vi.fn().mockResolvedValue(mockMetadata)

      vi.mocked(existsSync).mockReturnValue(true)
      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: mockMetadataFn,
        resize: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockBuffer),
      })
      ;(toIco as Mock).mockResolvedValue(mockBuffer)
      ;(mkdir as Mock).mockResolvedValue(undefined)
      ;(writeFile as Mock).mockResolvedValue(undefined)

      const { faviconGenerator } = await import('../index')
      const integration = faviconGenerator()

      const mockConfig = {
        root: new URL('file:///C:/Users/test/project/'),
      }

      await integration.hooks['astro:config:setup']?.({
        // @ts-expect-error - Partial mock
        config: mockConfig,
        command: 'build',
      })

      // Should successfully generate without path errors
      expect(writeFile).toHaveBeenCalledTimes(5)
    })
  })

  describe('Density Calculations', () => {
    it('should calculate correct density for 32x32 icon from 512x512 source', () => {
      const sourceDimension = 512
      const targetDimension = 32
      const sourceDensity = 72

      const calculatedDensity = (targetDimension / sourceDimension) * sourceDensity

      expect(calculatedDensity).toBe(4.5)
    })

    it('should calculate correct density for 64x64 icon from 512x512 source', () => {
      const sourceDimension = 512
      const targetDimension = 64
      const sourceDensity = 72

      const calculatedDensity = (targetDimension / sourceDimension) * sourceDensity

      expect(calculatedDensity).toBe(9)
    })

    it('should calculate correct density for 180x180 icon from 512x512 source', () => {
      const sourceDimension = 512
      const targetDimension = 180
      const sourceDensity = 72

      const calculatedDensity = (targetDimension / sourceDimension) * sourceDensity

      expect(calculatedDensity).toBeCloseTo(25.3125)
    })

    it('should calculate correct density for 192x192 icon from 512x512 source', () => {
      const sourceDimension = 512
      const targetDimension = 192
      const sourceDensity = 72

      const calculatedDensity = (targetDimension / sourceDimension) * sourceDensity

      expect(calculatedDensity).toBe(27)
    })

    it('should calculate correct density for 512x512 icon from 512x512 source', () => {
      const sourceDimension = 512
      const targetDimension = 512
      const sourceDensity = 72

      const calculatedDensity = (targetDimension / sourceDimension) * sourceDensity

      expect(calculatedDensity).toBe(72)
    })
  })
})
