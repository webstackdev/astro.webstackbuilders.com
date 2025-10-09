/**
 * Build lambda functions for Vercel. Based on Webpack. Expects no dependencies
 * on native node modules or other dependencies that don't expect to be bundled
 * like the Firebase SDK. Need a build step for lambda functions to use typescript
 * and webpack import/export syntax. Deploy to Vercel Functions.
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import type { TaskFunction } from 'gulp'
import { log } from '../utils.ts'

const execAsync = promisify(exec)

const task: TaskFunction = async done => {
  log(`Compile lambda functions for Vercel Functions deployment`)
  try {
    await execAsync(`vercel build --prod`)
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
