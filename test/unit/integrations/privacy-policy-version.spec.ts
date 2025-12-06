import { describe, expect, it, afterEach, vi } from 'vitest'

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

vi.mock('../../../src/lib/config/environmentServer', () => ({
  getOptionalEnv: vi.fn(),
}))

import { execSync } from 'node:child_process'

import { getOptionalEnv } from '../../../src/lib/config/environmentServer'
import { resolvePrivacyPolicyVersion } from '../../../src/integrations/PrivacyPolicyVersion/index'

describe('resolvePrivacyPolicyVersion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('returns PRIVACY_POLICY_VERSION when provided', () => {
    vi.mocked(getOptionalEnv).mockReturnValueOnce('2024-01-02')
    const version = resolvePrivacyPolicyVersion()

    expect(version).toBe('2024-01-02')
    expect(execSync).not.toHaveBeenCalled()
  })

  it('falls back to git metadata when env var is absent', () => {
    vi.mocked(getOptionalEnv).mockReturnValueOnce(undefined)
    vi.mocked(execSync).mockReturnValue('2023-05-05\n' as never)

    const version = resolvePrivacyPolicyVersion()

    expect(version).toBe('2023-05-05')
  })

  it('falls back to the current date when git is unavailable', () => {
    vi.mocked(getOptionalEnv).mockReturnValueOnce(undefined)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-12-06T12:00:00Z'))
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('git missing')
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const version = resolvePrivacyPolicyVersion()

    expect(version).toBe('2025-12-06')
  })
})
