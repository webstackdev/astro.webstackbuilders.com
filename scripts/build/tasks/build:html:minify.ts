/**
 * Minify HTML Transformer. Example code from 11ty docs.
 * Needs done close to the end so that anything modifying HTML files in the build
 * folder is finished, like injecting critical CSS into the head.
 */
import count from 'gulp-count'
import { dest, src } from 'gulp'
import htmlmin from 'gulp-htmlmin'
import type { TaskFunction } from 'gulp'
import type { Options } from 'html-minifier'
import { log } from '../utils'
import { buildDir } from '../paths'

const htmlMinifierOptions: Options = {
  collapseInlineTagWhitespace: false,
  collapseWhitespace: true,
  removeComments: true,
  sortClassName: true,
  useShortDoctype: true,
}

const task: TaskFunction = () => {
  log(`Minifying HTML in build directory`)
  return src(buildDir)
    .pipe(htmlmin(htmlMinifierOptions))
    .pipe(dest('.'))
    .pipe(count('## files minified'))
    .on('finish', () => log(` HTML minified`, `yellow`))
}

export default task
