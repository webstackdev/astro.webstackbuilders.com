/**
 * Issue release
 */
import type { TaskFunction } from 'gulp'
import run from 'gulp-run-command'
import { log } from '../utils'

const task: TaskFunction = async done => {
  log(`Releasing package`)
  try {
    await run('yarn np --no-cleanup')()
    done()
    return
  } catch (err) {
    if (err instanceof Error) {
      done(err)
      return
    }
    throw err
  }
}

export default task
