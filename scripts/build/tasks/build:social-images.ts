/**
 * Images generated for social sharing from pages. Requires SCSS for the images
 * and global data with metadata about each page to be generated before running.
 * Takes an HTML template with an <h1></h1> element to use as an anchor, generates
 * web pages for each image from the template and page metadata, and saves a
 * snapshot png image of each to use for social shares.
 */
import run from 'gulp-run-command'
import type { TaskFunction } from 'gulp'
import { log } from "@lib/logger"

const buildDir = `public`
const socialImagesBuildDir = `public/images/previews`
const tmpDir = `tmp`

const task: TaskFunction = async done => {
  log(`Compile social share images`)
  const workingDir = `${buildDir}/${tmpDir}`
  try {
    await run(
      `yarn eleventy-social-images --siteName 'Webstack Builders' --outputDir ${socialImagesBuildDir} --dataFile ${workingDir}/pages.json --templatePath ${workingDir}/template.html --stylesPath ${workingDir}/socialimages.css --width 600 --height 315 --deviceScaleFactor 2`
    )()
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
