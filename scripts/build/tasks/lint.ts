/**
 * Task to run all lint tasks
 */
import { series } from 'gulp'
import type { TaskFunction } from 'gulp'

import lintSass from './lint:sass.ts'
import lintScript from './lint:script.ts'

const task: TaskFunction = series(
  lintSass,
  lintScript
)
export default task
