/**
 * Package Release Integration
 *
 * Automatically injects a build-time release identifier for monitoring systems like Sentry.
 *
 * The release is injected as PACKAGE_RELEASE_VERSION environment variable in the format
 * "name@commitSha" when CI metadata is available, with a local fallback to "name@version".
 * It is available throughout the app as import.meta.env.PACKAGE_RELEASE_VERSION.
 *
 * Fallback order:
 * 1. CI/Vercel commit SHA
 * 2. package.json name@version
 * 3. BuildError if package.json cannot be read
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AstroIntegration } from 'astro'
import { getOptionalEnv, isTest } from '../../lib/config/environmentServer'
import { BuildError } from '../../lib/errors/BuildError'

interface PackageJson {
  name?: string
  version?: string
}

function readPackageJson(): PackageJson {
  const packageJsonPath = resolve(process.cwd(), 'package.json')
  const packageJsonContent = readFileSync(packageJsonPath, 'utf-8')

  return JSON.parse(packageJsonContent) as PackageJson
}

function getPackageName(): string {
  try {
    const packageJsonPath = resolve(process.cwd(), 'package.json')
    const packageJson = readPackageJson()
    const name = packageJson.name

    if (!name) {
      throw new BuildError('package.json is missing required field. name: missing', {
        phase: 'config-setup',
        filePath: packageJsonPath,
      })
    }

    return name
  } catch (error) {
    if (error instanceof BuildError) {
      throw error
    }

    const packageJsonPath = resolve(process.cwd(), 'package.json')
    throw new BuildError(
      `Could not read package.json for package name: ${error instanceof Error ? error.message : String(error)}`,
      { phase: 'config-setup', filePath: packageJsonPath, cause: error }
    )
  }
}

function getBuildRelease(): string | undefined {
  if (isTest()) {
    return undefined
  }

  const releaseCandidate = getOptionalEnv('GITHUB_SHA') ||
    getOptionalEnv('VERCEL_GIT_COMMIT_SHA') ||
    getOptionalEnv('PUBLIC_VERCEL_GIT_COMMIT_SHA')

  if (!releaseCandidate) {
    return undefined
  }

  return `${getPackageName()}@${releaseCandidate}`
}

/**
 * Get package release from package.json
 * @returns Release string in format "name@version"
 * @throws {BuildError} If package.json cannot be read or parsed
 */
export function getPackageRelease(): string {
  const buildRelease = getBuildRelease()
  if (buildRelease) {
    return buildRelease
  }

  try {
    const packageJsonPath = resolve(process.cwd(), 'package.json')
    const packageJson = readPackageJson()

    const name = packageJson.name
    const version = packageJson.version

    if (!name || !version) {
      throw new BuildError(
        `package.json is missing required fields. name: ${name ?? 'missing'}, version: ${version ?? 'missing'}`,
        { phase: 'config-setup', filePath: packageJsonPath }
      )
    }

    return `${name}@${version}`
  } catch (error) {
    if (error instanceof BuildError) {
      throw error
    }
    const packageJsonPath = resolve(process.cwd(), 'package.json')
    throw new BuildError(
      `Could not read package.json for release version: ${error instanceof Error ? error.message : String(error)}`,
      { phase: 'config-setup', filePath: packageJsonPath, cause: error }
    )
  }
}

/**
 * Astro integration that injects package release as PACKAGE_RELEASE_VERSION
 */
export function packageRelease(): AstroIntegration {
  return {
    name: 'package-release',
    hooks: {
      'astro:config:setup': async ({ updateConfig }) => {
        // Get release from package.json
        const release = getPackageRelease()

        console.log(`✅ Package release set to: ${release}`)

        // Inject as Vite define so it's available as import.meta.env.PACKAGE_RELEASE_VERSION
        updateConfig({
          vite: {
            define: {
              'import.meta.env.PACKAGE_RELEASE_VERSION': JSON.stringify(release),
            },
          },
        })
      },
    },
  }
}
