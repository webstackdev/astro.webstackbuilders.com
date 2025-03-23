/**
 * Gulp task to build SCSS for the project's main production
 * CSS bundle and output it to the 'public' directory
 */

import type { TaskFunction } from 'gulp'
import dartSass from 'sass'
import cssnano from 'cssnano'
import { dest, src } from 'gulp'
import gulpSass from 'gulp-sass'
import postcss from 'gulp-postcss'
import rename from 'gulp-rename'
import { resolve } from 'path'
import svgo from 'postcss-svgo'
import { log } from "@lib/logger"

const cssBuildDir = `public/css`
const scssSourceDir = `src/assets/scss`

const sass = gulpSass(dartSass)

const task: TaskFunction = () => {
  log(`Compiling SCSS to production CSS bundle`)
  return src(`${scssSourceDir}/index.scss`) // index.scss include file in assets
    // synchronous mode w/Dart SASS is 2x as fast as async since Node removed fibers in v16
    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    .pipe(sass.sync)
    // add vendor prefixing and focused optimizations
    .pipe(() => postcss([svgo(), cssnano()]))
    .pipe(() => rename(`index.css`))
    .pipe(dest(cssBuildDir))
    .on('finish', () => {
      log(`Production CSS bundle output to ${resolve(cssBuildDir, `index.css`)}`)
    })
}

export default task
