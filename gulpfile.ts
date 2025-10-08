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

task(`format`, format)
task(`format:json`, formatJson)

/**
 * Linting tasks
 */
import lint from './scripts/build/tasks/lint.ts'
import lintScript from './scripts/build/tasks/lint:script.ts'

task(`lint`, lint)
task(`lint:script`, lintScript)
