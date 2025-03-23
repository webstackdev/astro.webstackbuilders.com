import { afterEach, describe, expect, jest, test } from '@jest/globals'

//import MemoryFileSystem from 'memory-fs'
//import { Union } from 'unionfs'
import { buildDir } from '../paths'
import fs from 'node:fs'
import gulp from 'gulp'
import setup from '../tasks/util:setup'

const callback = (error: NodeJS.ErrnoException | null) => {
  expect(error).toBe(null)
}
/*
jest.mock('fs', () => {
  const ufs = new Union()
  const vfs = new MemoryFileSystem() as unknown as typeof fs
  return ufs.use(vfs)
})
*/
describe(`setup task creates necessary directories`, () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  // @TODO: This isn't working with the fs mock - getting ENOENT directory 'public' doesn't exist
  test.skip(`creates directories if they don't exist`, async () => {
    gulp.series(setup)(() => {})
    fs.access(buildDir, callback)
  })

  test.skip(`does not error if directories exist`, async () => {
    fs.mkdirSync(buildDir)
    gulp.series(setup)(() => {})
    fs.access(buildDir, callback)
  })
})
