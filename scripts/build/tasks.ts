/// <reference path="../../@types/npm-scripts-info.d.ts" />
import getScriptsInfo from 'npm-scripts-info'
import gulp from 'gulp'
import { readdir } from 'fs/promises'
import type { TaskFunction } from 'gulp'

let _pkgScripts: { [key: string]: string }

/**
 * `read-pkg-up` is a Sindresorhus ESM-only package. This is the
 * only way to get Jest with TypeScript to load ES modules,
 * without setting 'type' to 'module' in 'package.json'.
 * Using a dynamic import directly gets over-written by TS.
 */
/* eslint-disable-next-line @typescript-eslint/require-await */
const dynamicImport = async (packageName: string): Promise<object> => {
  /* eslint-disable-next-line @typescript-eslint/no-implied-eval */
  return new Function(`return import('${packageName}')`)()
}

/**
 * Get the npm-scripts-info from package.json to use in setting 'description' field
 */
export const loadpkgScripts = async () => {
  if (_pkgScripts) return _pkgScripts
  const pkgJson = await dynamicImport('read-pkg-up')
  _pkgScripts = getScriptsInfo(pkgJson)
  return _pkgScripts
}

export const getTaskDescription = (taskName: string) => {
  return _pkgScripts[taskName]
}

/** Load `scripts-info` key from `package.json` to use in setting `description` field */
// @TODO: no top level await error
//await loadpkgScripts()

/**
 * Generate parameters for Gulp task() method from a task template in the 'tasks' directory
 */
const addTask = async (taskName: string) => {
  const { task }: { task: TaskFunction } = await import('./build/gulp/tasks/' + taskName + '.ts')
  task.description = getTaskDescription(taskName)
  gulp.task(taskName, task)
}

/**
 *
 */
export const getTaskfiles = async () => {
  const taskFiles = await readdir('./build/gulp/tasks')
  return taskFiles.map(async taskFile => {
    if (!taskFile.match(/\.js$/i)) return
    await addTask(taskFile)
  })
}
