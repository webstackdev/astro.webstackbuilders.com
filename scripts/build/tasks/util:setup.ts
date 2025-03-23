/**
 * Make sure JS and CSS directories exist in the output folder
 */

import type { TaskFunction } from 'gulp'
import { buildPathsToCreate } from '../paths'
import { existsSync } from 'fs'
import { log } from '../utils'
import mkdirp from 'mkdirp'
import { resolve } from 'path'

const task: TaskFunction = done => {
  log(`Verifying build directories exist in the output folder`)
  try {
    let pathDeleted = false
    buildPathsToCreate.forEach(path => {
      const absPath = resolve(process.cwd(), path)
      if (existsSync(absPath)) return
      pathDeleted = true
      mkdirp.sync(absPath)
      log(`  Created ${absPath}`, `yellow`)
    })
    if (!pathDeleted) log(`  No directories created`, `yellow`)
    done()
  } catch(err) {
    if (err instanceof Error) {
      done(err)
      return
    }
    throw err
  }
}

export default task
