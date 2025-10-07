import { task } from 'gulp'

/**
 * Build tasks
 */
import buildLambda from './scripts/build/tasks/build:lambda.ts'
import buildSprites from './scripts/build/tasks/build:sprites.ts'


task(`build:lambda`, buildLambda)
task(`build:sprites`, buildSprites)


/**
 * Formatting tasks
 */
import format from './scripts/build/tasks/format.ts'
import formatJson from './scripts/build/tasks/format:json.ts'
import formatSass from './scripts/build/tasks/format:sass.ts'

task(`format`, format)
task(`format:json`, formatJson)
task(`format:sass`, formatSass)

/**
 * Linting tasks
 */
import lint from './scripts/build/tasks/lint.ts'
import lintSass from './scripts/build/tasks/lint:sass.ts'
import lintScript from './scripts/build/tasks/lint:script.ts'

task(`lint`, lint)
task(`lint:sass`, lintSass)
task(`lint:script`, lintScript)

/**
 * Generate statistics
 */




/**
 * Testing tasks
 */



