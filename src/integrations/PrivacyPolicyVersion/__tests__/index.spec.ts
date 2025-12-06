import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { TestError } from '@test/errors'

vi.mock('../../../lib/config/environmentServer', () => ({
  getOptionalEnv: vi.fn(() => undefined),
}))

// Mock child_process
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
}))

import { getOptionalEnv } from '../../../lib/config/environmentServer'

describe('PrivacyPolicyVersion Integration', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.mocked(getOptionalEnv).mockReturnValue(undefined)
    vi.mocked(existsSync).mockReturnValue(true)

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
    vi.useRealTimers()
  })

  describe('getPrivacyPolicyVersionFromGit', () => {
    it('should return git commit date in YYYY-MM-DD format', async () => {
      // Mock successful git command
      vi.mocked(execSync).mockReturnValue('2024-03-15\n')

      // Import after mocking to get fresh instance
      const { privacyPolicyVersion } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = privacyPolicyVersion()

      // Execute the astro:config:setup hook
      await integration.hooks['astro:config:setup']?.({
        updateConfig: mockUpdateConfig,
        // @ts-expect-error - Partial mock of AstroIntegrationOptions
        config: {},
      })

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('git log -1 --format=%cd --date=format:%Y-%m-%d'),
        expect.objectContaining({ encoding: 'utf-8' }),
      )

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        vite: {
          define: {
            'import.meta.env.PRIVACY_POLICY_VERSION': '"2024-03-15"',
          },
        },
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Privacy policy version set from git: 2024-03-15'),
      )
    })

    it('should trim whitespace from git output', async () => {
      // Mock git command with extra whitespace
      vi.mocked(execSync).mockReturnValue('  2024-03-15  \n  ')

      const { privacyPolicyVersion } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = privacyPolicyVersion()

      await integration.hooks['astro:config:setup']?.({
        updateConfig: mockUpdateConfig,
        // @ts-expect-error - Partial mock
        config: {},
      })

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        vite: {
          define: {
            'import.meta.env.PRIVACY_POLICY_VERSION': '"2024-03-15"',
          },
        },
      })
    })

    it('logs warning and falls back when git command fails', async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new TestError('Git command failed')
      })
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-12-06T00:00:00Z'))

      const { privacyPolicyVersion } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = privacyPolicyVersion()

      await integration.hooks['astro:config:setup']?.({
        updateConfig: mockUpdateConfig,
        // @ts-expect-error - Partial mock
        config: {},
      })

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        vite: {
          define: {
            'import.meta.env.PRIVACY_POLICY_VERSION': '"2025-12-06"',
          },
        },
      })
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('logs warning and falls back when git returns empty string', async () => {
      vi.mocked(execSync).mockReturnValue('')
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-05-01T00:00:00Z'))

      const { privacyPolicyVersion } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = privacyPolicyVersion()

      await integration.hooks['astro:config:setup']?.({
        updateConfig: mockUpdateConfig,
        // @ts-expect-error - Partial mock
        config: {},
      })

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        vite: {
          define: {
            'import.meta.env.PRIVACY_POLICY_VERSION': '"2025-05-01"',
          },
        },
      })
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('skips git lookup entirely when repository metadata is missing', async () => {
      vi.mocked(existsSync).mockReturnValue(false)
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-15T00:00:00Z'))

      const { privacyPolicyVersion } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = privacyPolicyVersion()

      await integration.hooks['astro:config:setup']?.({
        updateConfig: mockUpdateConfig,
        // @ts-expect-error - Partial mock
        config: {},
      })

      expect(execSync).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[privacy-policy-version] Git metadata not found. Skipping git lookup.',
      )
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        vite: {
          define: {
            'import.meta.env.PRIVACY_POLICY_VERSION': '"2026-01-15"',
          },
        },
      })
    })
  })

  describe('integration metadata', () => {
    it('should have correct integration name', async () => {
      const { privacyPolicyVersion } = await import('../index')

      const integration = privacyPolicyVersion()

      expect(integration.name).toBe('privacy-policy-version')
    })

    it('should have astro:config:setup hook', async () => {
      const { privacyPolicyVersion } = await import('../index')

      const integration = privacyPolicyVersion()

      expect(integration.hooks).toHaveProperty('astro:config:setup')
      expect(typeof integration.hooks['astro:config:setup']).toBe('function')
    })
  })

  describe('git command construction', () => {
    it('should target the correct privacy policy file path', async () => {
      vi.mocked(execSync).mockReturnValue('2024-03-15')

      const { privacyPolicyVersion } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = privacyPolicyVersion()

      await integration.hooks['astro:config:setup']?.({
        updateConfig: mockUpdateConfig,
        // @ts-expect-error - Partial mock
        config: {},
      })

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('src/pages/privacy/index.astro'),
        expect.any(Object),
      )
    })

    it('should use correct git date format', async () => {
      vi.mocked(execSync).mockReturnValue('2024-03-15')

      const { privacyPolicyVersion } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = privacyPolicyVersion()

      await integration.hooks['astro:config:setup']?.({
        updateConfig: mockUpdateConfig,
        // @ts-expect-error - Partial mock
        config: {},
      })

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--date=format:%Y-%m-%d'),
        expect.any(Object),
      )
    })

    it('executes git commands from the project root directory', async () => {
      vi.mocked(execSync).mockReturnValue('2024-03-15')

      const { privacyPolicyVersion } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = privacyPolicyVersion()

      await integration.hooks['astro:config:setup']?.({
        updateConfig: mockUpdateConfig,
        // @ts-expect-error - Partial mock
        config: {},
      })

      expect(execSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ cwd: process.cwd() }),
      )
    })
  })
})
