import {
  getPackageRelease,
  getPrivacyPolicyVersion,
} from '@components/scripts/utils/environmentClient'

interface EnvClientValues {
  packageRelease: string
  privacyPolicyVersion: string
}
type EnvValueKey = 'package-release' | 'privacy-policy-version'
type EnvElementState = 'ready' | 'error'

const setValue = (key: EnvValueKey, value: string, state: EnvElementState = 'ready') => {
  const element: HTMLOutputElement | null = document.querySelector(`[data-env-value="${key}"]`)
  if (!element) return
  element.textContent = value
  element.dataset['state'] = state
}

const values: EnvClientValues = {
  packageRelease: '',
  privacyPolicyVersion: '',
}

try {
  values.packageRelease = getPackageRelease()
  setValue('package-release', values.packageRelease)
} catch (error) {
  values.packageRelease = String(error)
  setValue('package-release', values.packageRelease, 'error')
}

try {
  values.privacyPolicyVersion = getPrivacyPolicyVersion()
  setValue('privacy-policy-version', values.privacyPolicyVersion)
} catch (error) {
  values.privacyPolicyVersion = String(error)
  setValue('privacy-policy-version', values.privacyPolicyVersion, 'error')
}

window.environmentClientValues = values
