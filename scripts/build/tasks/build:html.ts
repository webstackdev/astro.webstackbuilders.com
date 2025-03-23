/**
 * Run the Eleventy CLI to build the site HTML
 */
import run from 'gulp-run-command'
import type { TaskFunction } from 'gulp'
import { log } from '../utils'

const task: TaskFunction = async done => {
  log(`Compiling HTML for production bundle`)
  try {
    await run('yarn run eleventy')()
    done()
  } catch (err) {
    if (err instanceof Error) {
      done(err)
      return
    }
    throw err
  }
}

export default task
