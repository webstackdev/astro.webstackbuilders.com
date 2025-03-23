/**
 * Task to build the complete project, set file watchers, and launch dev server
 */
import { parallel, series } from 'gulp'
import type { TaskFunction } from 'gulp'
import clean from './util:clean'
import setup from './util:setup'
import buildCss from './build:css'
import buildFonts from './build:fonts'
import buildImages from './build:images'
import buildManifestIcons from './build:manifest-icons'
import buildSprites from './build:sprites'
import watchCss from './watch:css'
import watchHtml from './watch:html'
//import watchLambda from './watch:lambda'
import watchScript from './watch:script'

const init: TaskFunction = series(clean, setup)

const prewatch: TaskFunction = series(
  buildSprites, // must be before buildHtml
  buildCss, // must be before buildHtml
  buildFonts,
  buildImages,
  buildManifestIcons
)

const watch: TaskFunction = parallel(watchCss, watchScript, watchHtml)

const task: TaskFunction = series(init, prewatch, watch)
export default task
