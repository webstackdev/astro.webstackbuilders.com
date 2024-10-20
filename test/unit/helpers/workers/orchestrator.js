const { parentPort } = require('worker_threads')
const tsCompile = require('./compileTs')
const loadHtmlTemplate = require('./loadHtmlTemplate')

/**
 * Orchestrator is ran inside a worker thread and is responsible for executing the helper task
 *
 * @param options orchestrator params
 * @param {'tsCompile'|'loadHtmlTemplate'} options.helperType the name of the helper task to run
 * @param {string} options.inputPath the input path for the helper task
 */
const orchestrator = async ({ helperType, inputPath }) => {
  let result
  if ('tsCompile' === helperType) {
    result = await tsCompile(inputPath)
  } else if ('loadHtmlTemplate' === helperType) {
    result = await loadHtmlTemplate(inputPath)
  } else {
    throw new Error(`Invalid helperType passed to worker thread orchestrator: ${helperType}`)
  }
  /** Return the result to main thread */
  parentPort.postMessage(result)
}

parentPort.on('message', orchestrator)
