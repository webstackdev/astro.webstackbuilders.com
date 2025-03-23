/// <reference path='../../../@types/gulp-prettier.d.ts' />
/**
 * Lint JSON
 */
import { log } from '../utils'
import type { TaskFunction } from 'gulp'
import { dest, src } from 'gulp'
import lazypipe from 'lazypipe'
import prettier from 'gulp-prettier'

export const formatJsonTask = lazypipe()
  .pipe(prettier)

const task: TaskFunction = () => {
  log(`Linting script source code`)
  return src('./**/*.json')
    .pipe(formatJsonTask())
    .pipe(dest('.'))
  }

export default task
