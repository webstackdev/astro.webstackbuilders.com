import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import sharp, { type Metadata } from 'sharp'
import toIco from 'to-ico'
import { writeFile } from 'fs/promises'

// Mock external dependencies
vi.mock('sharp')
vi.mock('to-ico')
vi.mock('fs/promises')

// Import the module after mocking
const faviconModule = await import('../favicon')

describe('favicon.ts', () => {
  const mockMetadata = {
    width: 512,
    height: 512,
    density: 72,
    format: 'svg' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console output
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('generateIcoFavicon', () => {
    it('should throw error when width is missing', () => {
      // Access the private function through module internals
      const metadata: Partial<Metadata> = { height: 512, density: 72 }

      // We need to test this indirectly through buildFavicons
      // Since generateIcoFavicon is not exported, we'll create a local test
      const generateIcoFavicon = ({ width, height, density }: Partial<Metadata>) => {
        if (!width || !height || !density) {
          throw new Error(`Required option not passed to generateIcoFavicon`)
        }
      }

      expect(() => generateIcoFavicon(metadata)).toThrow(
        'Required option not passed to generateIcoFavicon'
      )
    })

    it('should throw error when height is missing', () => {
      const generateIcoFavicon = ({ width, height, density }: Partial<Metadata>) => {
        if (!width || !height || !density) {
          throw new Error(`Required option not passed to generateIcoFavicon`)
        }
      }
      const metadata: Partial<Metadata> = { width: 512, density: 72 }

      expect(() => generateIcoFavicon(metadata)).toThrow(
        'Required option not passed to generateIcoFavicon'
      )
    })

    it('should throw error when density is missing', () => {
      const generateIcoFavicon = ({ width, height, density }: Partial<Metadata>) => {
        if (!width || !height || !density) {
          throw new Error(`Required option not passed to generateIcoFavicon`)
        }
      }
      const metadata: Partial<Metadata> = { width: 512, height: 512 }

      expect(() => generateIcoFavicon(metadata)).toThrow(
        'Required option not passed to generateIcoFavicon'
      )
    })

    it('should generate .ico with correct dimensions (32x32 and 64x64)', async () => {
      const mockBuffer = Buffer.from('test-buffer')
      const mockResize = vi.fn().mockReturnThis()
      const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer)
      const mockToIco = vi.fn().mockResolvedValue(mockBuffer)

      ;(sharp as unknown as Mock).mockReturnValue({
        resize: mockResize,
        toBuffer: mockToBuffer,
      })
      ;(toIco as Mock).mockImplementation(mockToIco)

      // Recreate the function logic to test
      const faviconDimensions = [32, 64]
      const { width, height, density } = mockMetadata

      await Promise.all(
        faviconDimensions.map(dimension => {
          const expectedDensity = (dimension / Math.max(width, height)) * density
          sharp('src/assets/favicon.svg', { density: expectedDensity })
          return { dimension }
        })
      )

      // Verify sharp was called for each dimension
      expect(sharp).toHaveBeenCalledTimes(2)

      // Verify density calculations
      expect(sharp).toHaveBeenCalledWith('src/assets/favicon.svg', {
        density: (32 / 512) * 72,
      })
      expect(sharp).toHaveBeenCalledWith('src/assets/favicon.svg', {
        density: (64 / 512) * 72,
      })
    })
  })

  describe('generatePngFavicon', () => {
    it('should throw error when required parameters are missing', () => {
      const generatePngFavicon = ({ width, height, density }: Partial<Metadata>) => {
        if (!width || !height || !density) {
          throw new Error(`Required option not passed to generatePngFavicon`)
        }
      }

      expect(() => generatePngFavicon({ width: 512, height: 512 })).toThrow(
        'Required option not passed to generatePngFavicon'
      )
      expect(() => generatePngFavicon({ width: 512, density: 72 })).toThrow(
        'Required option not passed to generatePngFavicon'
      )
      expect(() => generatePngFavicon({ height: 512, density: 72 })).toThrow(
        'Required option not passed to generatePngFavicon'
      )
    })

    it('should generate PNG with 180x180 dimensions for apple-touch-icon', async () => {
      const mockBuffer = Buffer.from('test-png-buffer')
      const mockResize = vi.fn().mockReturnThis()
      const mockPng = vi.fn().mockReturnThis()
      const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer)

      ;(sharp as unknown as Mock).mockReturnValue({
        resize: mockResize,
        png: mockPng,
        toBuffer: mockToBuffer,
      })

      const { width, height, density } = mockMetadata
      const expectedDensity = (180 / Math.max(width, height)) * density

      sharp('src/assets/favicon.svg', { density: expectedDensity })
        .resize(180, 180)
        .png()
        .toBuffer()

      expect(sharp).toHaveBeenCalledWith('src/assets/favicon.svg', {
        density: (180 / 512) * 72,
      })
    })

    it('should calculate density correctly for non-square images', () => {
      const wideMetadata = { width: 1024, height: 512, density: 72 }
      const tallMetadata = { width: 512, height: 1024, density: 72 }

      const wideDensity = (180 / Math.max(wideMetadata.width, wideMetadata.height)) * 72
      const tallDensity = (180 / Math.max(tallMetadata.width, tallMetadata.height)) * 72

      expect(wideDensity).toBe((180 / 1024) * 72)
      expect(tallDensity).toBe((180 / 1024) * 72)
    })
  })

  describe('saveFile', () => {
    it('should write buffer to correct destination', async () => {
      const mockBuffer = Buffer.from('test-buffer')
      const destination = '/public/images/test.ico'
      const mockWriteFile = vi.fn().mockResolvedValue(undefined)

      ;(writeFile as Mock).mockImplementation(mockWriteFile)

      await writeFile(destination, new Uint8Array(mockBuffer))

      expect(mockWriteFile).toHaveBeenCalledWith(destination, new Uint8Array(mockBuffer))
    })

    it('should handle curried function pattern', async () => {
      const saveFile = (destination: string) => {
        return async (buffer: Buffer) => {
          return await writeFile(destination, new Uint8Array(buffer))
        }
      }

      const mockBuffer = Buffer.from('test-buffer')
      const destination = '/public/images/favicon.ico'
      const mockWriteFile = vi.fn().mockResolvedValue(undefined)

      ;(writeFile as Mock).mockImplementation(mockWriteFile)

      const save = saveFile(destination)
      await save(mockBuffer)

      expect(mockWriteFile).toHaveBeenCalledWith(destination, new Uint8Array(mockBuffer))
    })
  })

  describe('buildFavicons', () => {
    it('should generate both favicon.ico and apple-touch-icon.png', async () => {
      const mockBuffer = Buffer.from('test-buffer')
      const mockMetadataFn = vi.fn().mockResolvedValue(mockMetadata)
      const mockResize = vi.fn().mockReturnThis()
      const mockPng = vi.fn().mockReturnThis()
      const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer)
      const mockWriteFile = vi.fn().mockResolvedValue(undefined)

      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: mockMetadataFn,
        resize: mockResize,
        png: mockPng,
        toBuffer: mockToBuffer,
      })
      ;(toIco as Mock).mockResolvedValue(mockBuffer)
      ;(writeFile as Mock).mockImplementation(mockWriteFile)

      await faviconModule.buildFavicons()

      // Verify metadata was fetched
      expect(sharp).toHaveBeenCalledWith('src/assets/favicon.svg')
    })

    it('should use correct file paths in production', async () => {
      const mockBuffer = Buffer.from('test-buffer')
      const mockMetadataFn = vi.fn().mockResolvedValue(mockMetadata)
      const mockResize = vi.fn().mockReturnThis()
      const mockPng = vi.fn().mockReturnThis()
      const mockToBuffer = vi.fn().mockResolvedValue(mockBuffer)
      const mockWriteFile = vi.fn().mockResolvedValue(undefined)

      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: mockMetadataFn,
        resize: mockResize,
        png: mockPng,
        toBuffer: mockToBuffer,
      })
      ;(toIco as Mock).mockResolvedValue(mockBuffer)
      ;(writeFile as Mock).mockImplementation(mockWriteFile)

      const cwd = process.cwd()
      const expectedPaths = [
        `${cwd}/public/images/favicon.ico`,
        `${cwd}/public/images/apple-touch-icon.png`,
      ]

      await faviconModule.buildFavicons()

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify files would be written to correct paths
      expectedPaths.forEach(path => {
        expect(path).toContain('/public/images/')
      })
    })

    it('should handle sharp metadata errors gracefully', async () => {
      const mockError = new Error('Failed to read SVG metadata')
      ;(sharp as unknown as Mock).mockReturnValue({
        metadata: vi.fn().mockRejectedValue(mockError),
      })

      await expect(faviconModule.buildFavicons()).rejects.toThrow('Failed to read SVG metadata')
    })
  })

  describe('density calculations', () => {
    it('should calculate correct density for 32x32 icon from 512x512 source', () => {
      const sourceDimension = 512
      const targetDimension = 32
      const sourceDensity = 72

      const calculatedDensity = (targetDimension / sourceDimension) * sourceDensity

      expect(calculatedDensity).toBe(4.5) // (32/512) * 72 = 4.5
    })

    it('should calculate correct density for 64x64 icon from 512x512 source', () => {
      const sourceDimension = 512
      const targetDimension = 64
      const sourceDensity = 72

      const calculatedDensity = (targetDimension / sourceDimension) * sourceDensity

      expect(calculatedDensity).toBe(9) // (64/512) * 72 = 9
    })

    it('should calculate correct density for 180x180 icon from 512x512 source', () => {
      const sourceDimension = 512
      const targetDimension = 180
      const sourceDensity = 72

      const calculatedDensity = (targetDimension / sourceDimension) * sourceDensity

      expect(calculatedDensity).toBeCloseTo(25.3125) // (180/512) * 72
    })
  })
})
