//import { getTaskfiles } from './scripts/build/tasks'
import { task } from 'gulp'

// @TODO: see scripts/build/tasks.ts for a dynamic task loader that adds package descriptions from the `package.json` file

/**
 * Build tasks
 */
//import build from './scripts/build/tasks/build'
//import buildCss from './scripts/build/tasks/build:css'
////import buildCssCritical from './scripts/build/tasks/build:css-critical'
//import buildFonts from './scripts/build/tasks/build:fonts'
//import buildHtml from './scripts/build/tasks/build:html'
//import buildHtmlDebug from './scripts/build/tasks/build:html:debug'
//import buildHtmlCompress from './scripts/build/tasks/build:html:compress'
//import buildHtmlMinify from './scripts/build/tasks/build:html:minify'
//import buildImages from './scripts/build/tasks/build:images'
//import buildLambda from './scripts/build/tasks/build:lambda'
//import buildManifestIcons from './scripts/build/tasks/build:manifest-icons'
//import buildScript from './scripts/build/tasks/build:script'
//import buildServiceworker from './scripts/build/tasks/build:service-worker'
//import buildSocialImages from './scripts/build/tasks/build:social-images'
//import buildSocialStyles from './scripts/build/tasks/build:social-styles'
import buildSprites from './scripts/build/tasks/build:sprites'

//task(`build:css-critical`, buildCssCritical)
//task(`build:css`, buildCss)
//task(`build:fonts`, buildFonts)
//task(`build:html:compress`, buildHtmlCompress)
//task(`build:html:debug`, buildHtmlDebug)
//task(`build:html:minify`, buildHtmlMinify)
//task(`build:html`, buildHtml)
//task(`build:images`, buildImages)
//task(`build:lambda`, buildLambda)
//task(`build:manifest-icons`, buildManifestIcons)
//task(`build:script`, buildScript)
//task(`build:service-worker`, buildServiceworker)
//task(`build:social-images`, buildSocialImages)
//task(`build:social-styles`, buildSocialStyles)
task(`build:sprites`, buildSprites)
//task(`build`, build)

/**
 * Formatting tasks
 */
//import format from './scripts/build/tasks/format'
//import formatJson from './scripts/build/tasks/format:json'
//import formatSass from './scripts/build/tasks/format:sass'
//import formatScript from './scripts/build/tasks/format:script'

//task(`format`, format)
//task(`format:json`, formatJson)
//task(`format:sass`, formatSass)
//task(`format:script`, formatScript)

/**
 * Linting tasks
 */
//import lint from './scripts/build/tasks/lint'
//import lintFrontmatter from './scripts/build/tasks/lint:frontmatter'
//import lintSass from './scripts/build/tasks/lint:sass'
//import lintScript from './scripts/build/tasks/lint:script'

//task(`lint`, lint)
//task(`lint:frontmatter`, lintFrontmatter)
//task(`lint:sass`, lintSass)
//task(`lint:script`, lintScript)

/**
 * Start a production server task
 */
//import start from './scripts/build/tasks/start'

//task(`start`, start)

/**
 * Generate statistics
 */
//import htmlStats from './scripts/build/tasks/stats:html'
//import scriptStats from './scripts/build/tasks/stats:script'

//task(`stats:html`, htmlStats)
//task(`stats:script`, scriptStats)

/**
 * Linting tasks
 */
//import testAll from './scripts/build/tasks/test:all'
//import testCoverage from './scripts/build/tasks/test:coverage'
//import testE2e from './scripts/build/tasks/test:e2e'
//import testCodegenE2e from './scripts/build/tasks/test:e2e:codegen'
//import testReportE2e from './scripts/build/tasks/test:e2e:report'
//import testUpdateBrowsersE2e from './scripts/build/tasks/test:e2e:update-browsers'
//import testUnit from './scripts/build/tasks/test:unit'
//import testUnitClearCache from './scripts/build/tasks/test:unit:clear-cache'
//import testUnitCi from './scripts/build/tasks/test:unit:ci'
//import testUnitUpdateSnapshot from './scripts/build/tasks/test:unit:update-snapshot'

//task(`test:all`, testAll)
//task(`test:coverage`, testCoverage)
//task(`test:e2e`, testE2e)
//task(`test:e2e:codegen`, testCodegenE2e)
//task(`test:e2e:report`, testReportE2e)
//task(`test:e2e:update-browsers`, testUpdateBrowsersE2e)
//task(`test:unit`, testUnit)
//task(`test:unit:clear-cache`, testUnitClearCache)
//task(`test:unit:ci`, testUnitCi)
//task(`test:unit:update-snapshot`, testUnitUpdateSnapshot)

/**
 * Utility tasks
 */
//import clean from './scripts/build/tasks/util:clean'
//import release from './scripts/build/tasks/util:release'
//import setup from './scripts/build/tasks/util:setup'
//import version from './scripts/build/tasks/util:version'

//task(`util:clean`, clean)
//task(`clean`, clean) // convenience alias
//task(`util:release`, release)
//task(`util:setup`, setup)
//task(`util:version`, version)

/**
 * Watch tasks
 */
//import watch from './scripts/build/tasks/watch'
//import watchCss from './scripts/build/tasks/watch:css'
//import watchHtml from './scripts/build/tasks/watch:html'
//import watchLambda from './scripts/build/tasks/watch:lambda'
//import watchScript from './scripts/build/tasks/watch:script'
//import watchTestUnit from './scripts/build/tasks/watch:test:unit'

//task(`watch`, watch)
//task(`watch:css`, watchCss)
//task(`watch:html`, watchHtml)
//task(`watch:lambda`, watchLambda)
//task(`watch:script`, watchScript)
//task(`watch:test:unit`, watchTestUnit)
