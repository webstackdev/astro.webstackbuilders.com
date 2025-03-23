/**
 * Checks front matter of all content source in 'src/pages" directory
 */

import type { TaskFunction } from 'gulp'
import { log } from '../utils'
import { validate } from '../../validateFrontmatter/validate'

const task: TaskFunction = async () => {
  log(`Linting frontmatter`)
  await validate()
}

export default task
