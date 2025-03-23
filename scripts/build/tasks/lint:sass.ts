/// <reference path='../../../@types/gulp-stylelint.d.ts' />
/**
 * Lint SCSS Stylesheets
 */
import { log, withError } from '../utils'
import { src } from 'gulp'
import gulpStylelint from 'gulp-stylelint'
import lazypipe from 'lazypipe'
import type { TaskFunction } from 'gulp'
import { scssWatchGlob } from '../paths'
import stylelintConfig from '../../../.stylelintrc.js'

export const lintSassTask = lazypipe()
  // stylelint --fix 'src/assets/scss/**/*.scss' --custom-syntax postcss-scss
  .pipe(() => gulpStylelint({
    config: stylelintConfig,
    debug: false,
    /** Autofix with fixes applied to the gulp stream */
    fix: false,
    reporters: [
      { formatter: 'string', console: true }
    ],
  }))

const task: TaskFunction = done => {
  log(`Lint SASS stylings source code`)
  return src(scssWatchGlob)
    .pipe(lintSassTask())
    .on('error', () => {
      done(withError(`Style lint found errors`) as unknown as Error)
    })
}

export default task
