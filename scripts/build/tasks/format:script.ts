/// <reference path='../../../@types/gulp-prettier.d.ts' />
import _ from 'lodash'
import { dest, src } from 'gulp'
import gulpESLintNew from 'gulp-eslint-new'
import lazypipe from 'lazypipe'
import prettier from 'gulp-prettier'
import type { TaskFunction } from 'gulp'
import { log } from '../utils'
import { scriptSourceGlobs } from '../paths'

/**
 * Format Javascript and Typescript
 */
export const formatScriptTask = lazypipe()
  /**
   * Run Prettier before output is fed into ES Lint
   */
  .pipe(prettier)
  /**
   * Lint files. ESLint autofix option is set to false so no fixes are created.
   */
  .pipe(function () {
    return gulpESLintNew({ fix: true })
  })
  /**
   * Overwrite files with the fixed content provided by ESLint, should be
   * used in conjunction with the option fix in `gulpESLintNew(options)`.
   */
  .pipe(gulpESLintNew.fix)
  /**
   * Format all linted files in the stream once after piping through
   * gulpESLintNew. Outputs lint results to the console.
   */
  .pipe(gulpESLintNew.format)
  /**
   * Stop a task/stream if an ESLint error has been reported for
   * any file, but wait for all of them to be processed first.
   */
  .pipe(gulpESLintNew.failAfterError)

const task: TaskFunction = () => {
  log(`Linting script source code`)
  return src(scriptSourceGlobs)
    .pipe(formatScriptTask())
    .pipe(dest('.'))
}

export default task
