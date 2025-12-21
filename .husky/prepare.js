#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Husky prepare script to install git hooks. It's designed to quiet warnings on
 * CI environments where .git directory may be missing when "prepare" script runs
 * (e.g., during "npm install" step).
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const projectRoot = process.cwd()
const gitDirectory = join(projectRoot, '.git')

const isCi = process.env.CI === '1' || process.env.CI === 'true'
const isProduction = process.env.NODE_ENV === 'production'

// In production installs, package managers commonly omit devDependencies.
// Husky lives in devDependencies, so running it would fail the install.
if (isCi || isProduction) {
  console.warn(`✅ Skipping Husky install: CI=${String(process.env.CI ?? '')} NODE_ENV=${String(process.env.NODE_ENV ?? '')}`)
  process.exit(0)
}

if (!existsSync(gitDirectory)) {
  console.warn(`✅ Skipping Husky install: missing .git directory at ${gitDirectory}`)
  process.exit(0)
}

const huskyBin = join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'husky.cmd' : 'husky')

if (!existsSync(huskyBin)) {
  console.warn(`✅ Skipping Husky install: missing husky binary at ${huskyBin}`)
  process.exit(0)
}

try {
  console.log(`Running Husky install from ${projectRoot}`)
  execSync(huskyBin, { stdio: 'inherit', cwd: projectRoot })
  console.log('✅ Husky install complete')
} catch (error) {
  console.error('❌ Husky install failed')
  const status = typeof error === 'object' && error && 'status' in error && typeof error.status === 'number'
    ? error.status
    : 1
  process.exit(status)
}
