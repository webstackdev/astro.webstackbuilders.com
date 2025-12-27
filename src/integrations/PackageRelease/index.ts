/**
 * Package Release Integration
 *
 * Automatically injects the package name and version at build time from package.json.
 * This provides a release identifier for tracking regressions between numbered releases
 * in monitoring services like Sentry.
 *
 * The release is injected as PACKAGE_RELEASE_VERSION environment variable in the format
 * "name@version" and is available throughout the app as import.meta.env.PACKAGE_RELEASE_VERSION
 *
 * Fallback order:
 * 1. Manual env var (PACKAGE_RELEASE_VERSION in .env)
 * 2. package.json name@version
 * 3. "unknown@0.0.0" (if package.json cannot be read)
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AstroIntegration } from 'astro'
import { BuildError } from '../../lib/errors/BuildError'

interface PackageJson {
  name?: string
  version?: string
}

/**
 * Get package release from package.json
 * @returns Release string in format "name@version"
 * @throws {BuildError} If package.json cannot be read or parsed
 */
function getPackageRelease(): string {
  try {
    const packageJsonPath = resolve(process.cwd(), 'package.json')
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageJsonContent) as PackageJson

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
