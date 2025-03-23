/**
 * Task to run all lint tasks
 */
import { series } from 'gulp'
import type { TaskFunction } from 'gulp'

import lintFrontmatter from './lint:frontmatter'
import lintSass from './lint:sass'
import lintScript from './lint:script'

const task: TaskFunction = series(
  lintFrontmatter,
  lintSass,
  lintScript
)
export default task
