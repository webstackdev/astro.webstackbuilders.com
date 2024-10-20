/**
 * Inline Typescript compiler for use in passing string script to JSDOM. This file
 * is called from within a worker thread when the Webpack task is executed.
 */
const MemoryFs = require('memory-fs')
const webpack = require('webpack')
const { resolve } = require('path')
const { statSync } = require('fs')

const outputDirPath = resolve('tmp')
const outputFilename = 'app.min.js'
const outputPath = resolve(outputDirPath, outputFilename)

const getWebpackConfig = entryFile => {
  return {
    mode: 'development',
    devtool: 'hidden-source-map',
    entry: resolve(process.cwd(), entryFile),
    output: {
      path: outputDirPath,
      filename: outputFilename,
    },
    // Add `.ts` as a resolvable extension.
    resolve: {
      extensions: ['.ts', '.js'],
    },
    // Loaders describe to webpack how to process non-native modules and include these
    // dependencies into your bundles. Native loaders are ECMAScript, CommonJS, and AMD.
    module: {
      rules: [
        {
          // Transpile and polyfill client-side JavaScript files.
          // All files with a `.ts` extension will be handled by `ts-loader`.
          test: /\.ts$/,
          use: [
            {
              loader: require.resolve(`ts-loader`),
              options: {
                configFile: 'tsconfig.webpack.json',
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
  }
}

const entryFileExists = (entryFile) => {
  try {
    const exists = statSync(entryFile).isFile() // throws if path does not exist
    if (!exists) throw new Error(`'entryFile' exists but is not a file.`)
    return true
  } catch(err) {
    throw new Error(`File path passed to tsCompile is not valid:\n${entryFile}.\n${err}`)
  }
}

/**
 * Determines if an object is a Webpack Stats object passed to a compile run callback
 */
function isStatsObject(input) {
  if (
    input &&
    typeof input === 'object' &&
    typeof input['hasErrors'] === 'function' &&
    typeof input['hasWarnings'] === 'function' &&
    typeof input['toString'] === 'function'
  )
    return true
  return false
}

/**
 * Compiles a TS file to JS
 *
 * @param entryFile - A relative path from the project root to the TypeScript file to compile
 * @returns - A JavaScript string
 */
const tsCompile = async (entryFile) => {
  entryFileExists(entryFile)

  const compiler = webpack(getWebpackConfig(entryFile))
  compiler.outputFileSystem = new MemoryFs()

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) return reject(err)
      if (!isStatsObject(stats)) return reject(`stats object in tsCompile is not valid`)
      if (stats.hasErrors() || stats.hasWarnings()) {
        return reject(
          new Error(
            stats.toString({
              errorDetails: true,
              warnings: true,
            })
          )
        )
      }
      const result = compiler.outputFileSystem
        .readFileSync(outputPath)
        .toString()
      resolve(result)
    })
  })
}

module.exports = tsCompile
