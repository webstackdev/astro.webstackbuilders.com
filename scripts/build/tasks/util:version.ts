/**
 * Issue release
 */
import type { TaskFunction } from 'gulp'
import run from 'gulp-run-command'
import { log } from '../utils'

const task: TaskFunction = async done => {
  log(`Bumping package version`)
  try {
    await run('yarn version')()
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
