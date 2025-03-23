/**
 * Record Playwright test matchers in live browser session
 */
import type { TaskFunction } from 'gulp'
import run from 'gulp-run-command'
import { log } from "@lib/logger"

const task: TaskFunction = async done => {
  log(`Record Playwright test matchers in live browser session`)
  try {
    await run(`playwright codegen http://localhost:${process.env['ELEVENTY_DEV_SERVER_PORT']}/`)()
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
