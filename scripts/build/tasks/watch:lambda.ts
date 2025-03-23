/**
 * Webpack Dev build has watcher set
 */
import run from 'gulp-run-command'
import type { TaskFunction } from 'gulp'
import { log } from '../utils'

const task: TaskFunction = async done => {
  log(`Compile site serverless functions and watch for changes`)
  try {
    /**
     * Also see `running a local development environment` and `netlify dev`.
     * Netlify dev requires running `netlify init` first and linking a repo
     * to Netlify
     */
    await run('yarn netlify-lambda build lambda --config ./webpack.config.lambda.dev.js')()
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
