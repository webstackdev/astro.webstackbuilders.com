/**
 * Task to build the complete project for production
 */
import { series } from 'gulp'
import { deleteSync } from 'del'
import type { TaskFunction } from 'gulp'
import { buildDir, tmpDir } from '../paths'
import { log } from '../utils'

import buildCss from './build:css'
import buildFonts from './build:fonts'
import buildHtml from './build:html'
import buildHtmlCompress from './build:html:compress'
import buildHtmlMinify from './build:html:minify'
import buildImages from './build:images'
//import buildLambda from './build:lambda'
import buildManifestIcons from './build:manifest-icons'
import buildScript from './build:script'
import buildServiceworker from './build:service-worker'
import buildSocialImages from './build:social-images'
import buildSocialStyles from './build:social-styles'
import buildSprites from './build:sprites'
import clean from './util:clean'
import setup from './util:setup'

// - Styles SCSS and site HTML must be compiled before the social images build step
const socialImagesBuild: TaskFunction = series(buildSocialStyles, buildSocialImages)

// Eleventy also has build events https://www.11ty.dev/docs/events
// 'before', 'after', 'afterWatch' configured in .eleventy.js
const prebuild: TaskFunction = series(clean, setup)

// - Sprites must be built before HTML for the `sprites.njk` template to be available
// - CSS must be built before HTML for the cachebuster plugin to work
//
const build: TaskFunction = series(
  buildSprites, // must be before buildHtml
  buildCss, // must be before buildHtml
  buildFonts,
  buildImages,
  buildHtml,
  buildScript
)

// - Social images use generated HTML as input to create images
// - Service worker build step needs access to completed site to build sw script
const postbuild: TaskFunction = series(
  //buildLambda,
  socialImagesBuild,
  buildServiceworker,
  buildHtmlMinify,
  buildHtmlCompress,
  buildManifestIcons
)

const removeTmpDir: TaskFunction = done => {
  log(`Deleting tmp directory`)
  try {
    const deletedPaths = deleteSync(`${buildDir}/${tmpDir}`)
    if (!deletedPaths.length) {
      log(`  No tmp to delete`, `yellow`)
      done()
      return
    }
    done()
  } catch (err) {
    if (err instanceof Error) {
      done(err)
      return
    }
    throw err
  }
}

// - minifying HTML should be close to very last task
// - @TODO: need to bundle the final build dir for distribution?
const task: TaskFunction = series(prebuild, build, postbuild, removeTmpDir)
export default task
