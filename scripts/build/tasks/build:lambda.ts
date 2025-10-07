/**
 * Build lambda functions for Vercel. Based on Webpack. Expects no dependencies
 * on native node modules or other dependencies that don't expect to be bundled
 * like the Firebase SDK. Need a build step for lambda functions to use typescript
 * and webpack import/export syntax. Deploy to Vercel Functions.
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import type { TaskFunction } from 'gulp'
import { log } from '../utils.ts'

const execAsync = promisify(exec)

// @TODO:

// TS_NODE_PROJECT="tsconfig.gulp.json" yarn gulp build:lambda
// Error: error:0308010C:digital envelope routines::unsupported
// (/home/kevin/Repos/webstackdev/eleventy.webstackbuilders.com/node_modules/vercel-build/node_modules/webpack/lib/util/createHash.js:135:53)

// Caused by Node 17 no longer supporting md4 as hash function. Fixes:
// monkey patching crypto for md4 and Node.js v17
// NODE_OPTIONS=--openssl-legacy-provider

// Webpack says: We are planning to migrate to a different hash function anyway for webpack 6. So currently you will have to use output.hashFunction: "xxhash64" in configuration to fix that. Or NODE_OPTIONS=--openssl-legacy-provider

// NODE_OPTIONS=--openssl-legacy-provider TS_NODE_PROJECT="tsconfig.gulp.json" yarn gulp build:lambda
// TypeError: loaderContext.getOptions is not a function at getLoaderOptions
// (/home/kevin/Repos/webstackdev/eleventy.webstackbuilders.com/node_modules/ts-loader/dist/index.js:91:41)

// Couldn't figure out how to get around this error.
// I found a workaround to downgrade only ts-loader v8 even if i use webpack@5.74.0. yarn add -D "ts-loader"@"^8.4.0"

// ends up with this error. solutions found were mostly about webpack/ts-loader version conflicts:
// TypeError: Cannot read properties of undefined (reading 'tap')
// (/home/kevin/Repos/webstackdev/eleventy.webstackbuilders.com/node_modules/ts-loader/dist/instances.js:218:50)

// giving up for now

const task: TaskFunction = async done => {
  log(`Compile lambda functions for Vercel Functions deployment`)
  try {
    await execAsync(`vercel build --prod`)
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
