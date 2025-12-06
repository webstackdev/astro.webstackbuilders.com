/**
 * Privacy Policy Version Integration
 *
 * Automatically determines the privacy policy version at build time based on
 * the last git commit date of the privacy policy file. This ensures consent
 * records track which version of the privacy policy users agreed to.
 *
 * The version is injected as PRIVACY_POLICY_VERSION environment variable
 * and is available throughout the app as import.meta.env.PRIVACY_POLICY_VERSION
 *
 * Fallback order:
 * 1. Manual env var (PRIVACY_POLICY_VERSION in .env)
 * 2. Git commit date of privacy policy file (YYYY-MM-DD format)
 * 3. Current date (if git is unavailable)
 */

import { execSync } from 'node:child_process'
import type { AstroIntegration } from 'astro'

const PRIVACY_POLICY_PATH = 'src/pages/privacy/index.astro'

export const toIsoDateString = (date: Date): string => date.toISOString().slice(0, 10)

/**
 * Get privacy policy version from git commit date
 * @param filePath - Path to privacy policy file (relative to project root)
 * @returns ISO date string (YYYY-MM-DD) of last commit
 */
function getPrivacyPolicyVersionFromGit(filePath: string): string | null {
  try {
    // Get last commit date for privacy policy file in YYYY-MM-DD format
    const lastCommitDate = execSync(
      `git log -1 --format=%cd --date=format:%Y-%m-%d -- ${filePath}`,
      { encoding: 'utf-8' },
    ).trim()

    if (lastCommitDate) {
      return lastCommitDate
    }

    console.warn(
      `[privacy-policy-version] No git commits found for privacy policy file: ${filePath}. Falling back to current date.`,
    )
    return null
  } catch (error) {
    console.warn(
      `[privacy-policy-version] Could not get privacy policy version from git: ${error instanceof Error ? error.message : String(error)}`,
    )
    return null
  }
}

/**
 * Resolve privacy policy version using env, git metadata, or current date fallback.
 */
export function resolvePrivacyPolicyVersion(): string {
  const envVersion = process.env.PRIVACY_POLICY_VERSION?.trim()
  if (envVersion) {
    console.log(`✅ Privacy policy version sourced from env: ${envVersion}`)
    return envVersion
  }

  const gitVersion = getPrivacyPolicyVersionFromGit(PRIVACY_POLICY_PATH)
  if (gitVersion) {
    console.log(`✅ Privacy policy version set from git: ${gitVersion}`)
    return gitVersion
  }

  const fallback = toIsoDateString(new Date())
  console.log(`⚠️  Privacy policy version fallback applied: ${fallback}`)
  return fallback
}

/**
 * Astro integration that injects privacy policy version as PRIVACY_POLICY_VERSION
 */
export function privacyPolicyVersion(): AstroIntegration {
  return {
    name: 'privacy-policy-version',
    hooks: {
      'astro:config:setup': async ({ updateConfig }) => {
        const version = resolvePrivacyPolicyVersion()

        // Inject as Vite define so it's available as import.meta.env.PRIVACY_POLICY_VERSION
        updateConfig({
          vite: {
            define: {
              'import.meta.env.PRIVACY_POLICY_VERSION': JSON.stringify(version),
            },
          },
        })
      },
    },
  }
}
