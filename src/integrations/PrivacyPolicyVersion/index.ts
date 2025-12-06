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
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { AstroIntegration } from 'astro'
import { getOptionalEnv } from '../../lib/config/environmentServer'

const PROJECT_ROOT = process.cwd()
const PRIVACY_POLICY_PATH = join(PROJECT_ROOT, 'src', 'pages', 'privacy', 'index.astro')
const GIT_DIRECTORY_PATH = join(PROJECT_ROOT, '.git')

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
      { encoding: 'utf-8', cwd: PROJECT_ROOT },
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
 * Determine whether git metadata is available before issuing git commands.
 * Vercel preview builds, for example, do not clone the repo with git history,
 * so attempting to run git commands will fail immediately. Checking for a git
 * directory lets us skip the expensive call entirely.
 */
function hasGitRepository(): boolean {
  try {
    return existsSync(GIT_DIRECTORY_PATH)
  } catch (error) {
    console.warn(
      `[privacy-policy-version] Unable to verify git repository: ${error instanceof Error ? error.message : String(error)}`,
    )
    return false
  }
}

/**
 * Resolve privacy policy version using env, git metadata, or current date fallback.
 */
export function resolvePrivacyPolicyVersion(): string {
  const rawEnvVersion = getOptionalEnv('PRIVACY_POLICY_VERSION')
  const envVersion = typeof rawEnvVersion === 'string' ? rawEnvVersion.trim() : ''
  if (envVersion) {
    console.log(`✅ Privacy policy version sourced from env: ${envVersion}`)
    return envVersion
  }

  if (hasGitRepository()) {
    const gitVersion = getPrivacyPolicyVersionFromGit(PRIVACY_POLICY_PATH)
    if (gitVersion) {
      console.log(`✅ Privacy policy version set from git: ${gitVersion}`)
      return gitVersion
    }
  } else {
    console.warn('[privacy-policy-version] Git metadata not found. Skipping git lookup.')
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
