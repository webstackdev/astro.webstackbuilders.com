/**
 * Run Jest unit tests
 */
import { series, type TaskFunction } from 'gulp'
import run from 'gulp-run-command'
import { log } from "@lib/logger"
import testUnitClearCache from './test:unit:clear-cache'

const unitTestTask: TaskFunction = async done => {
  log(`Running unit tests with Jest`)
  try {
    await run(`${process.cwd()}/node_modules/.bin/vitest`, {
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

const task: TaskFunction = series(testUnitClearCache, unitTestTask)

export default task
