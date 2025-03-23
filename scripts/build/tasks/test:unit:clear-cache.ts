/**
 * Run Jest unit tests
 */
import type { TaskFunction } from 'gulp'
import run from 'gulp-run-command'
import { log } from "@lib/logger"

const task: TaskFunction = async done => {
  log(`Clear Jest's cache`)
  try {
    await run(`${process.cwd()}/node_modules/.bin/vitest --clearCache`, {
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
