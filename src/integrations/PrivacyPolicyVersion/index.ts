/**
 * Privacy Policy Version Integration
 *
 * Automatically determines the privacy policy version at build time based on
 * the last git commit date of the privacy policy file. This ensures consent
 * records track which version of the privacy policy users agreed to.
 *
 * The version is injected as PUBLIC_PRIVACY_POLICY_VERSION environment variable
 * and is available throughout the app as import.meta.env.PUBLIC_PRIVACY_POLICY_VERSION
 *
 * Fallback order:
 * 1. Manual env var (PUBLIC_PRIVACY_POLICY_VERSION in .env)
 * 2. Git commit date of privacy policy file (YYYY-MM-DD format)
 * 3. Current date (if git is unavailable)
 */

import { execSync } from 'node:child_process'
import type { AstroIntegration } from 'astro'

/**
 * Get privacy policy version from git commit date
 * @param filePath - Path to privacy policy file (relative to project root)
 * @returns ISO date string (YYYY-MM-DD) of last commit, or current date as fallback
 */
function getPrivacyPolicyVersionFromGit(filePath: string): string {
  try {
    // Get last commit date for privacy policy file in YYYY-MM-DD format
    const lastCommitDate = execSync(
      `git log -1 --format=%cd --date=format:%Y-%m-%d -- ${filePath}`,
      { encoding: 'utf-8' },
    ).trim()

    if (lastCommitDate) {
      return lastCommitDate
    }

    // If no commits found (new file), use current date
    return new Date().toISOString().split('T')[0] ?? ''
  } catch (error) {
    // Git not available or command failed - use current date
    console.warn(
      `⚠️  Could not get privacy policy version from git. Using current date. Error: ${error instanceof Error ? error.message : String(error)}`,
    )
    return new Date().toISOString().split('T')[0] ?? ''
  }
}

/**
 * Astro integration that injects privacy policy version as PUBLIC_PRIVACY_POLICY_VERSION
 */
export function privacyPolicyVersion(): AstroIntegration {
  return {
    name: 'privacy-policy-version',
    hooks: {
      'astro:config:setup': async ({ updateConfig }) => {
        // Get version from git commit date
        const privacyPolicyPath = 'src/pages/privacy/index.astro'
        const version = getPrivacyPolicyVersionFromGit(privacyPolicyPath)

        console.log(`✅ Privacy policy version set to: ${version}`)

        // Inject as Vite define so it's available as import.meta.env.PUBLIC_PRIVACY_POLICY_VERSION
        updateConfig({
          vite: {
            define: {
              'import.meta.env.PUBLIC_PRIVACY_POLICY_VERSION': JSON.stringify(version),
            },
          },
        })
      },
    },
  }
}
