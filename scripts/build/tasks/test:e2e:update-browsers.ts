/**
 * Run Playwright end-to-end testing framework
 */
import type { TaskFunction } from 'gulp'
import run from 'gulp-run-command'
import { log } from "@lib/logger"

const task: TaskFunction = async done => {
  log(`Updating Playwright browser executables`)
  try {
    await run('playwright install')()
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
