/**
 * Task to run all lint tasks
 */
import { series } from 'gulp'
import type { TaskFunction } from 'gulp'

import lintScript from './lint:script.ts'

const task: TaskFunction = series(
  lintScript
)
export default task
