/// <reference path="../paths.d.ts" />
/**
 * Copy site images over to the output directory, doing any necessary optimization
 */
import { dest, src } from 'gulp'
import type { TaskFunction } from 'gulp'
import { log } from '../utils'
import { siteImagesSourceDir, imagesBuildDir } from '../paths'

const task: TaskFunction = () => {
  log(`Compiling site images`)
  return src(`${siteImagesSourceDir}/**/*{.webp, .avif, .png, .jpeg, .jpg, .gif}`)
    .pipe(dest(imagesBuildDir))
    .on('finish', () => log(` Added site images to ${imagesBuildDir}`, `yellow`))
}

export default task
