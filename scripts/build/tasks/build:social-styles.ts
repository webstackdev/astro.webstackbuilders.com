/**
 * Build the CSS bundle used to style social share images
 */
import { buildCssTask } from './build:css'
import { log } from "@lib/logger"
import { dest, src } from 'gulp'
import rename from 'gulp-rename'
import type { TaskFunction } from 'gulp'

const buildDir = `public`
const tmpDir = `tmp`
const socialScssSourceFile = `src/assets/scss/socialimages.scss`

const task: TaskFunction = () => {
  log(`Compiling social styles SCSS to production CSS bundle`)
  return src(socialScssSourceFile)
    .pipe(buildCssTask())
    .pipe(rename(`socialimages.css`))
    .pipe(dest(`${buildDir}/${tmpDir}`))
    .on('finish', () =>
      log(`Social styles compiled to ${buildDir}/${tmpDir}/socialimages.css`, `yellow`)
    )
}

export default task
