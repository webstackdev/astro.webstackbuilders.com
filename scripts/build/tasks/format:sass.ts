/// <reference path='../../../@types/gulp-stylelint.d.ts' />
/**
 * Lint and write back fixes to SCSS Stylesheets
 */
import { log } from '../utils'
import { src, dest } from 'gulp'
import gulpStylelint from 'gulp-stylelint'
import lazypipe from 'lazypipe'
import type { TaskFunction } from 'gulp'
import { scssSourceDir, scssWatchGlob } from '../paths'
import stylelintConfig from '../../../.stylelintrc'
import type { Config } from 'stylelint'

export const formatSassTask = lazypipe()
  .pipe(() => gulpStylelint({
    config: (stylelintConfig as unknown as Config),
    debug: false,
    /** Autofix with fixes applied to the gulp stream */
    fix: true,
    reporters: [
      { formatter: 'string', console: true }
    ],
  }))

const task: TaskFunction = () => {
  log(`Format SASS stylings source code`)
  return src(scssWatchGlob)
    .pipe(formatSassTask())
    .pipe(dest(scssSourceDir))
    .on('error', () => { log(`Style lint errors found`, `red`)})
}

export default task
