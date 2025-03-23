/**
 * Run a web server that serves from the production build for e2e testing
 */
import path from 'path'
import run from 'gulp-run-command'
import * as dotenv from 'dotenv'
import type { DotenvParseOutput } from 'dotenv/lib/main'
import type { TaskFunction } from 'gulp'
import { buildDir } from '../paths'
import { log } from '../utils'

function isParsed(output: DotenvParseOutput | undefined): output is DotenvParseOutput {
  return output !== undefined
}

const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
if (result['error']) throw result.error
if (!isParsed(result.parsed)) throw new Error()

const testingPort = result.parsed['ELEVENTY_TESTING_SERVER_PORT']
const serveDir = `./${buildDir}/`


const task: TaskFunction = async done => {
  log(`Serving production build. Make sure site is built before running this command.`)
  try {
    await run(`yarn serve -l ${testingPort} ${serveDir}`)()
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
