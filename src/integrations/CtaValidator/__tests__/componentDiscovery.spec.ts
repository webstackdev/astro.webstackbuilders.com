/**
 * Unit tests for component discovery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { discoverCallToActionComponents } from '../componentDiscovery'
import { TestError } from '@test/errors'

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
}))

describe('discoverCallToActionComponents', () => {
  let mockReaddir: any
  let mockReadFile: any
  let mockLogger: any

  beforeEach(async () => {
    const fs = await import('fs/promises')
    mockReaddir = vi.mocked(fs.readdir)
    mockReadFile = vi.mocked(fs.readFile)
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should discover components with index.astro files', async () => {
    mockReaddir.mockResolvedValue([
      { name: 'Contact', isDirectory: () => true, isFile: () => false },
      { name: 'Newsletter', isDirectory: () => true, isFile: () => false },
    ] as any)

    mockReadFile.mockResolvedValue('component content')

    const components = await discoverCallToActionComponents(
      '/project',
      'src/components/CallToAction',
      mockLogger,
      false
    )

    expect(components).toHaveLength(2)
    expect(components[0]).toMatchObject({
      name: 'Contact',
      importPatterns: ['<Contact', '<Contact/>', '<Contact '],
    })
    expect(components[1]).toMatchObject({
      name: 'Newsletter',
      importPatterns: ['<Newsletter', '<Newsletter/>', '<Newsletter '],
    })
  })

  it('should skip directories without index.astro', async () => {
    mockReaddir.mockResolvedValue([
      { name: 'Contact', isDirectory: () => true, isFile: () => false },
      { name: 'OtherFolder', isDirectory: () => true, isFile: () => false },
    ] as any)

    // First call succeeds (Contact), second fails (OtherFolder)
    mockReadFile
      .mockResolvedValueOnce('component content')
      .mockRejectedValueOnce(new TestError('ENOENT'))

    const components = await discoverCallToActionComponents(
      '/project',
      'src/components/CallToAction',
      mockLogger,
      false
    )

    expect(components).toHaveLength(1)
    expect(components[0]?.name).toBe('Contact')
  })

  it('should skip non-directory entries', async () => {
    mockReaddir.mockResolvedValue([
      { name: 'Contact', isDirectory: () => true, isFile: () => false },
      { name: 'README.md', isDirectory: () => false, isFile: () => true },
    ] as any)

    mockReadFile.mockResolvedValue('component content')

    const components = await discoverCallToActionComponents(
      '/project',
      'src/components/CallToAction',
      mockLogger,
      false
    )

    expect(components).toHaveLength(1)
    expect(components[0]?.name).toBe('Contact')
  })

  it('should log discovery when debug is enabled', async () => {
    mockReaddir.mockResolvedValue([
      { name: 'Featured', isDirectory: () => true, isFile: () => false },
    ] as any)

    mockReadFile.mockResolvedValue('component content')

    await discoverCallToActionComponents(
      '/project',
      'src/components/CallToAction',
      mockLogger,
      true // debug enabled
    )

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Found component 'Featured'")
    )
  })

  it('should log warning when skipping directories without index.astro', async () => {
    mockReaddir.mockResolvedValue([
      { name: 'Invalid', isDirectory: () => true, isFile: () => false },
    ] as any)

    mockReadFile.mockRejectedValue(new TestError('ENOENT'))

    await discoverCallToActionComponents(
      '/project',
      'src/components/CallToAction',
      mockLogger,
      true // debug enabled
    )

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Skipping 'Invalid' - no index.astro found")
    )
  })

  it('should throw error when component directory cannot be read', async () => {
    mockReaddir.mockRejectedValue(new TestError('Permission denied'))

    await expect(
      discoverCallToActionComponents(
        '/project',
        'src/components/CallToAction',
        mockLogger,
        false
      )
    ).rejects.toThrow(/Failed to read CallToAction components directory/)
  })

  it('should return empty array when no components found', async () => {
    mockReaddir.mockResolvedValue([])

    const components = await discoverCallToActionComponents(
      '/project',
      'src/components/CallToAction',
      mockLogger,
      false
    )

    expect(components).toEqual([])
  })

  it('should handle multiple components correctly', async () => {
    mockReaddir.mockResolvedValue([
      { name: 'Contact', isDirectory: () => true, isFile: () => false },
      { name: 'Newsletter', isDirectory: () => true, isFile: () => false },
      { name: 'Download', isDirectory: () => true, isFile: () => false },
      { name: 'Featured', isDirectory: () => true, isFile: () => false },
    ] as any)

    mockReadFile.mockResolvedValue('component content')

    const components = await discoverCallToActionComponents(
      '/project',
      'src/components/CallToAction',
      mockLogger,
      false
    )

    expect(components).toHaveLength(4)
    expect(components.map((c) => c.name)).toEqual([
      'Contact',
      'Newsletter',
      'Download',
      'Featured',
    ])
  })
})
