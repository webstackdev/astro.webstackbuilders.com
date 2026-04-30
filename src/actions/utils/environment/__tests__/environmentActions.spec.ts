import { afterEach, describe, expect, it } from 'vitest'
import { getPrivacyPolicyVersion } from '../environmentActions'

const testEnv = import.meta.env as unknown as Record<string, string | undefined>
const originalPrivacyPolicyVersion = testEnv['PRIVACY_POLICY_VERSION']

describe('environmentActions.getPrivacyPolicyVersion', () => {
  afterEach(() => {
    testEnv['PRIVACY_POLICY_VERSION'] = originalPrivacyPolicyVersion
  })

  it('returns the integration-injected privacy policy version', () => {
    testEnv['PRIVACY_POLICY_VERSION'] = '2026-04-21'

    expect(getPrivacyPolicyVersion()).toBe('2026-04-21')
  })
})
