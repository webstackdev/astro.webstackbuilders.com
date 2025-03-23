/**
 * Gulp task to watch HTML for changes
 */
import path from 'path'
import run from 'gulp-run-command'
import * as dotenv from 'dotenv'
import type { DotenvParseOutput } from 'dotenv/lib/main'
import type { TaskFunction } from 'gulp'
import { log } from '../utils'

function isParsed(output: DotenvParseOutput | undefined): output is DotenvParseOutput {
  return output !== undefined
}

const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
if (result['error']) throw result.error
if (!isParsed(result.parsed)) throw new Error()

const testingPort = result.parsed['ELEVENTY_DEV_SERVER_PORT']

const task: TaskFunction = async done => {
  log(`Compiling HTML for production bundle`)
  try {
    await run(`yarn run eleventy --watch --serve --incremental --port=${testingPort}`)()
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
