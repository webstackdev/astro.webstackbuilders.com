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
import { BuildError } from '../../lib/errors/BuildError'

/**
 * Get privacy policy version from git commit date
 * @param filePath - Path to privacy policy file (relative to project root)
 * @returns ISO date string (YYYY-MM-DD) of last commit
 * @throws {BuildError} If git command fails or returns empty result
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

    // If no commits found (new file), throw error
    throw new BuildError(
      `No git commits found for privacy policy file: ${filePath}`,
      { phase: 'config-setup', filePath },
    )
  } catch (error) {
    // Git not available or command failed
    if (error instanceof BuildError) {
      throw error
    }
    throw new BuildError(
      `Could not get privacy policy version from git: ${error instanceof Error ? error.message : String(error)}`,
      { phase: 'config-setup', tool: 'git', cause: error },
    )
  }
}

/**
 * Astro integration that injects privacy policy version as PRIVACY_POLICY_VERSION
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
