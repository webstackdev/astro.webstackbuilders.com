/// <reference path="../../../@types/critical.d.ts" />
import lazypipe from 'lazypipe'
import { stream } from 'critical'
import { log } from '../utils'
import { assetBuildDir, buildDir } from '../paths'
import { dest, src } from 'gulp'
import type { TaskFunction } from 'gulp'
import type { GulpError } from '../utils'

/**
 * Generate & inline critical path CSS
 */
export const buildCssCriticalTask = lazypipe().pipe(
  () => stream({
    assetPaths: [assetBuildDir],
    base: buildDir,
    inline: true,
  })
)

const task: TaskFunction = () => {
  log(`Extracting critical CSS and injecting it to head of html files in production bundle`)
  return (
    src(`${buildDir}/*.html`)
      .pipe(buildCssCriticalTask())
      .on('data', file => {
        const filePath = file.path as unknown as string
        log(`Inlining CSS to file ${filePath}`)
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('error', (err: any) => {
        log.error(err as unknown as GulpError)
      })
      .pipe(dest(buildDir))
  )
}

export default task
