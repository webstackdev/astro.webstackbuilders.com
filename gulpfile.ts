import { task } from 'gulp'

/**
 * Linting tasks
 */
import lint from './scripts/build/tasks/lint.ts'
import lintScript from './scripts/build/tasks/lint:script.ts'

task(`lint`, lint)
task(`lint:script`, lintScript)
