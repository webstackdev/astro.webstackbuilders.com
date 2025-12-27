import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { TestError } from '@test/errors'

// Mock node:fs
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}))

describe('PackageRelease Integration', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Reset mocks
    vi.clearAllMocks()

    // Reset module cache to get fresh instance
    vi.resetModules()
  })

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  describe('getPackageRelease', () => {
    it('should return package name and version in name@version format', async () => {
      // Mock successful package.json read
      const mockPackageJson = JSON.stringify({
        name: 'webstackbuilders-corporate-website',
        version: '1.2.3',
      })
      vi.mocked(readFileSync).mockReturnValue(mockPackageJson)

      // Import after mocking to get fresh instance
      const { packageRelease } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = packageRelease()

      // Execute the astro:config:setup hook
      await integration.hooks['astro:config:setup']?.({
        updateConfig: mockUpdateConfig,
        // @ts-expect-error - Partial mock of AstroIntegrationOptions
        config: {},
      })

      expect(readFileSync).toHaveBeenCalledWith(expect.stringContaining('package.json'), 'utf-8')

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        vite: {
          define: {
            'import.meta.env.PACKAGE_RELEASE_VERSION': '"webstackbuilders-corporate-website@1.2.3"',
          },
        },
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Package release set to: webstackbuilders-corporate-website@1.2.3')
      )
    })

    it('should throw BuildError when package.json has missing name field', async () => {
      const mockPackageJson = JSON.stringify({
        version: '1.2.3',
      })
      vi.mocked(readFileSync).mockReturnValue(mockPackageJson)

      const { packageRelease } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = packageRelease()

      await expect(
        integration.hooks['astro:config:setup']?.({
          updateConfig: mockUpdateConfig,
          // @ts-expect-error - Partial mock
          config: {},
        })
      ).rejects.toThrow('package.json is missing required fields')
    })

    it('should throw BuildError when package.json has missing version field', async () => {
      const mockPackageJson = JSON.stringify({
        name: 'webstackbuilders-corporate-website',
      })
      vi.mocked(readFileSync).mockReturnValue(mockPackageJson)

      const { packageRelease } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = packageRelease()

      await expect(
        integration.hooks['astro:config:setup']?.({
          updateConfig: mockUpdateConfig,
          // @ts-expect-error - Partial mock
          config: {},
        })
      ).rejects.toThrow('package.json is missing required fields')
    })

    it('should throw BuildError when package.json cannot be read', async () => {
      // Mock file read failure
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new TestError('File not found')
      })

      const { packageRelease } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = packageRelease()

      await expect(
        integration.hooks['astro:config:setup']?.({
          updateConfig: mockUpdateConfig,
          // @ts-expect-error - Partial mock
          config: {},
        })
      ).rejects.toThrow('Could not read package.json for release version')

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should throw BuildError when package.json contains invalid JSON', async () => {
      // Mock invalid JSON
      vi.mocked(readFileSync).mockReturnValue('{ invalid json }')

      const { packageRelease } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = packageRelease()

      await expect(
        integration.hooks['astro:config:setup']?.({
          updateConfig: mockUpdateConfig,
          // @ts-expect-error - Partial mock
          config: {},
        })
      ).rejects.toThrow('Could not read package.json for release version')

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should throw BuildError when package.json has both fields missing', async () => {
      const mockPackageJson = JSON.stringify({
        description: 'Some package',
      })
      vi.mocked(readFileSync).mockReturnValue(mockPackageJson)

      const { packageRelease } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = packageRelease()

      await expect(
        integration.hooks['astro:config:setup']?.({
          updateConfig: mockUpdateConfig,
          // @ts-expect-error - Partial mock
          config: {},
        })
      ).rejects.toThrow('package.json is missing required fields')
    })
  })

  describe('integration metadata', () => {
    it('should have correct integration name', async () => {
      const { packageRelease } = await import('../index')

      const integration = packageRelease()

      expect(integration.name).toBe('package-release')
    })

    it('should have astro:config:setup hook', async () => {
      const { packageRelease } = await import('../index')

      const integration = packageRelease()

      expect(integration.hooks).toHaveProperty('astro:config:setup')
      expect(typeof integration.hooks['astro:config:setup']).toBe('function')
    })
  })

  describe('file path resolution', () => {
    it('should resolve package.json from project root', async () => {
      const mockPackageJson = JSON.stringify({
        name: 'test-package',
        version: '1.0.0',
      })
      vi.mocked(readFileSync).mockReturnValue(mockPackageJson)

      const { packageRelease } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = packageRelease()

      await integration.hooks['astro:config:setup']?.({
        updateConfig: mockUpdateConfig,
        // @ts-expect-error - Partial mock
        config: {},
      })

      // Verify the path includes package.json
      expect(readFileSync).toHaveBeenCalledWith(expect.stringContaining('package.json'), 'utf-8')
    })
  })

  describe('version format validation', () => {
    it('should handle semver versions correctly', async () => {
      const testCases = [
        { version: '1.0.0', expected: 'test@1.0.0' },
        { version: '0.0.1', expected: 'test@0.0.1' },
        { version: '2.1.3', expected: 'test@2.1.3' },
        { version: '10.20.30', expected: 'test@10.20.30' },
      ]

      for (const { version, expected } of testCases) {
        vi.clearAllMocks()
        vi.resetModules()

        const mockPackageJson = JSON.stringify({
          name: 'test',
          version,
        })
        vi.mocked(readFileSync).mockReturnValue(mockPackageJson)

        const { packageRelease } = await import('../index')

        const mockUpdateConfig = vi.fn()
        const integration = packageRelease()

        await integration.hooks['astro:config:setup']?.({
          updateConfig: mockUpdateConfig,
          // @ts-expect-error - Partial mock
          config: {},
        })

        expect(mockUpdateConfig).toHaveBeenCalledWith({
          vite: {
            define: {
              'import.meta.env.PACKAGE_RELEASE_VERSION': `"${expected}"`,
            },
          },
        })
      }
    })
  })
})
