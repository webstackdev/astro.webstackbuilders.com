import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { existsSync } from 'node:fs'
import { log as gitLog } from 'isomorphic-git'
import { TestError } from '@test/errors'

vi.mock('../../../lib/config/environmentServer', () => ({
  getOptionalEnv: vi.fn(() => undefined),
  isGitHub: vi.fn(() => false),
  getGitHubRepoPath: vi.fn(() => '/github/workspace'),
}))

vi.mock('isomorphic-git', () => ({
  log: vi.fn(),
}))

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
}))

import { getOptionalEnv, isGitHub, getGitHubRepoPath } from '../../../lib/config/environmentServer'

describe('PrivacyPolicyVersion Integration', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    vi.mocked(getOptionalEnv).mockReturnValue(undefined)
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(isGitHub).mockReturnValue(false)
    vi.mocked(getGitHubRepoPath).mockReturnValue('/github/workspace')

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    vi.useRealTimers()
  })

  describe('resolvePrivacyPolicyVersion', () => {
    it('returns PRIVACY_POLICY_VERSION when provided', async () => {
      vi.mocked(getOptionalEnv).mockReturnValueOnce('2024-01-02')

      const { resolvePrivacyPolicyVersion } = await import('../index')

      const version = await resolvePrivacyPolicyVersion()

      expect(version).toBe('2024-01-02')
      expect(gitLog).not.toHaveBeenCalled()
    })

    it('falls back to git metadata when env var is absent', async () => {
      vi.mocked(getOptionalEnv).mockReturnValueOnce(undefined)
      vi.mocked(gitLog).mockResolvedValueOnce([
        {
          oid: 'deadbeef',
          commit: {
            committer: {
              timestamp: Math.floor(new Date('2023-05-05T12:00:00Z').getTime() / 1000),
              timezoneOffset: 0,
            },
          },
        },
      ] as never)

      const { resolvePrivacyPolicyVersion } = await import('../index')

      const version = await resolvePrivacyPolicyVersion()

      expect(version).toBe('2023-05-05')
    })

    it('falls back to the current date when git is unavailable', async () => {
      vi.mocked(getOptionalEnv).mockReturnValueOnce(undefined)
      vi.mocked(gitLog).mockRejectedValueOnce(new TestError('git missing') as never)
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-12-06T12:00:00Z'))

      const { resolvePrivacyPolicyVersion } = await import('../index')

      const version = await resolvePrivacyPolicyVersion()

      expect(version).toBe('2025-12-06')
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

  describe('git lookup behavior', () => {
    it('sets version from git log for the privacy policy file', async () => {
      vi.mocked(gitLog).mockResolvedValueOnce([
        {
          oid: 'deadbeef',
          commit: {
            committer: {
              timestamp: Math.floor(new Date('2024-03-15T12:00:00Z').getTime() / 1000),
              timezoneOffset: 0,
            },
          },
        },
      ] as never)

      const { privacyPolicyVersion } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = privacyPolicyVersion()

      await integration.hooks['astro:config:setup']?.({
        updateConfig: mockUpdateConfig,
        // @ts-expect-error - Partial mock of AstroIntegrationOptions
        config: {},
      })

      expect(gitLog).toHaveBeenCalledWith(
        expect.objectContaining({
          dir: process.cwd(),
          filepath: 'src/pages/privacy/index.astro',
          depth: 1,
        }),
      )

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        vite: {
          define: {
            'import.meta.env.PRIVACY_POLICY_VERSION': '"2024-03-15"',
          },
        },
      })
    })

    it('executes from GitHub workspace when running in GitHub Actions', async () => {
      vi.mocked(isGitHub).mockReturnValue(true)
      vi.mocked(getGitHubRepoPath).mockReturnValue('/github/workspace')
      vi.mocked(gitLog).mockResolvedValueOnce([
        {
          oid: 'deadbeef',
          commit: {
            committer: {
              timestamp: Math.floor(new Date('2024-03-15T12:00:00Z').getTime() / 1000),
              timezoneOffset: 0,
            },
          },
        },
      ] as never)

      const { privacyPolicyVersion } = await import('../index')

      const mockUpdateConfig = vi.fn()
      const integration = privacyPolicyVersion()

      await integration.hooks['astro:config:setup']?.({
        updateConfig: mockUpdateConfig,
        // @ts-expect-error - Partial mock
        config: {},
      })

      expect(gitLog).toHaveBeenCalledWith(
        expect.objectContaining({
          dir: '/github/workspace',
          filepath: 'src/pages/privacy/index.astro',
        }),
      )
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

      expect(gitLog).not.toHaveBeenCalled()
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

    it('falls back when git returns no commits for the file', async () => {
      vi.mocked(gitLog).mockResolvedValueOnce([] as never)
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

    it('falls back when git log throws', async () => {
      vi.mocked(gitLog).mockRejectedValueOnce(new TestError('Git log failed') as never)
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
  })
})
