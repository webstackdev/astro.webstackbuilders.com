/**
 * Task to test the project
 */
import { series } from 'gulp'
import type { TaskFunction } from 'gulp'

import testUnit from './test:unit'
import testE2E from './test:e2e'

const task: TaskFunction = series(testUnit, testE2E)
export default task
