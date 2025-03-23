import _ from 'lodash'
import { src } from 'gulp'
import gulpESLintNew from 'gulp-eslint-new'
import lazypipe from 'lazypipe'
import type { TaskFunction } from 'gulp'
import { log, withError } from '../utils'
import { scriptSourceGlobs } from '../paths'

/**
 * Lint Javascript and Typescript
 */
/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
export const lintScriptTask = lazypipe()
  /**
   * Lint files. ESLint autofix option is set to false so no fixes are created.
   */
  .pipe(function () {
    return gulpESLintNew({ fix: false })
  })
  /**
   * Format all linted files in the stream once after piping through
   * gulpESLintNew. Outputs lint results to the console.
   */
  .pipe(gulpESLintNew.format)


// Getting '* can't resolve reference #/definitions/directiveConfigSchema from id #'
// https://github.com/typescript-eslint/typescript-eslint/issues/5525
// See note in test also (skipped)
const task: TaskFunction = (done) => {
  log(`Linting script source code`)
  // @TODO: Error: premature close
   return src(scriptSourceGlobs)
    .pipe(lintScriptTask())
    .on('finish', () => done())
    .on('error', () => {
      done(withError(`ES Lint found errors`) as unknown as Error)
    })
}

export default task
