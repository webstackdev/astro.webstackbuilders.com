/**
 * Build the production Javascript bundle
 */
import run from 'gulp-run-command'
import type { TaskFunction } from 'gulp'
import { log } from '../utils'

const task: TaskFunction = async done => {
  log(``)
  try {
    await run('webpack --progress --config webpack.config.prod.js')()
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
