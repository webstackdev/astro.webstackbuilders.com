/**
 * Optimize and copy font files over to the output directory
 */
import { dest, src } from 'gulp'
import type { TaskFunction } from 'gulp'
import { log } from '../utils'
import { fontsSourceDir, fontsBuildDir } from '../paths'

const task: TaskFunction = () => {
  log(`Compiling fonts`)
  return src(`${fontsSourceDir}/**/*.woff2`)
    .pipe(dest(fontsBuildDir))
    .on('finish', () => log(`Fonts compiled to ${fontsBuildDir}`, `yellow`))
}

export default task
