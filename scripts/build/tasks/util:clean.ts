/**
 * Delete generated directories before builds
 */

import type { TaskFunction } from 'gulp'
import { buildPathsToClean } from '../paths'
import { sync } from 'del'
import { log } from '../utils'

const task: TaskFunction = done => {
  log(`Deleting build output directories`)
  try {
    const deletedPaths = sync(buildPathsToClean)
    if (!deletedPaths.length) {
      log(`  No build output directories to delete`, `yellow`)
      done()
      return
    }
    deletedPaths.forEach(path => {
      log(`  Deleted ${path}`, `yellow`)
    })
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
