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

if (!existsSync(gitDirectory)) {
  console.warn(`✅ Skipping Husky install: missing .git directory at ${gitDirectory}`)
  process.exit(0)
}

try {
  console.log(`Running Husky install from ${projectRoot}`)
  execSync('husky', { stdio: 'inherit', cwd: projectRoot })
  console.log('✅ Husky install complete')
} catch (error) {
  console.error('❌ Husky install failed')
  const status = typeof error === 'object' && error && 'status' in error && typeof error.status === 'number'
    ? error.status
    : 1
  process.exit(status)
}
