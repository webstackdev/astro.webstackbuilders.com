/**
 * Run Playwright end-to-end testing framework
 */
import type { TaskFunction } from 'gulp'
import run from 'gulp-run-command'
import { log } from "@lib/logger"

const cacheDir = `.cache`

const task: TaskFunction = async done => {
  log(`Show test reports in browser, run this after running Playwright test runner`)
  try {
    await run(`playwright show-report ${cacheDir}/playwright/reports`)()
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
