/**
 * Compile production script bundle and watch it for changes
 */
import run from 'gulp-run-command'
import type { TaskFunction } from 'gulp'
import { log } from '../utils'

const task: TaskFunction = async done => {
  log(`Compile site script bundle and watch for changes`)
  try {
    await run('webpack --progress --profile --config webpack.config.dev.js', {
      ignoreErrors: true,
    })()
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
