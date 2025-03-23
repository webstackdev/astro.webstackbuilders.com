/**
 * Run Jest with code coverage reporter enabled
 */
import type { TaskFunction } from 'gulp'
import run from 'gulp-run-command'
import { log } from "@lib/logger"

const task: TaskFunction = async done => {
  log(`Running unit tests with Jest`)
  try {
    await run('yarn vitest --coverage', {
      env: { NODE_OPTIONS: '--experimental-vm-modules' },
    })()
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
