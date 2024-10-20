/**
 * This file is called from within a worker thread when a task is executed
 */
import { getWorkerPool } from './pool'

export const tsCompile = async (entryFile: string) => {
  return (await getWorkerPool().getStaticPool().exec({
    helperType: 'tsCompile',
    inputPath: entryFile,
  })) as unknown as Promise<string>
}

export const loadHtmlTemplate = async (templatePath: string) => {
  return (await getWorkerPool().getStaticPool().exec({
    helperType: 'loadHtmlTemplate',
    inputPath: templatePath,
  })) as unknown as Promise<string>
}

export const cleanup = async () => {
  await getWorkerPool().cleanup()
}
