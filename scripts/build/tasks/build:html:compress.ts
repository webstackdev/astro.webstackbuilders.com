/// <reference path="../../../@types/gulp-count.d.ts" />
/**
 * Compress relevant files in build directory
 */
import count from 'gulp-count'
import { dest, src } from 'gulp'
import gzip from 'gulp-gzip'
import type { TaskFunction } from 'gulp'
import { log } from '../utils'
import { buildDir } from '../paths'

const task: TaskFunction = () => {
  log(`Compiling fonts`)
  return src(buildDir)
    .pipe(gzip())
    .pipe(dest('.'))
    .pipe(count('## files compressed'))
    .on('finish', () => log(`Build files compressed`, `yellow`))
}

export default task
