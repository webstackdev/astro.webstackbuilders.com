import { describe, expect, test } from '@jest/globals'

import { exec } from 'child_process'
import path from 'path'

// @TODO: tests skipped because of problem with ESM module dependencies passed to ts-node

describe(`Logging function works`, () => {
  test.skip('prints a string given to the logging function', done => {
    const loggerInstance = path.resolve(
      process.cwd(),
      'scripts/build/__fixtures__/logger_string_param.ts'
    )
    exec(`ts-node --esm ${loggerInstance} --project './tsconfig.jest.json'`, stdout => {
      expect(stdout).toMatchInlineSnapshot()
      //expect(stdout).toMatch(/something happened/)
      done()
    })
  })

  test.skip('prints an array of string given to the logging function', done => {
    const loggerInstance = path.resolve(
      process.cwd(),
      'scripts/build/__fixtures__/logger_array_param.ts'
    )
    exec(`ts-node --esm ${loggerInstance} --project './tsconfig.jest.json'`, (_, stdout) => {
      expect(stdout).toMatchInlineSnapshot(`""`)
      //expect(stdout).toMatch(/something happened/)
      //expect(stdout).toMatch(/something else happened/)
      done()
    })
  })
})

describe(`Error handler functionality`, () => {
  test.skip('prints an error to console', done => {
    const errorHandlerFixture = path.resolve(
      process.cwd(),
      'scripts/build/__fixtures__/errorHandler.ts'
    )
    exec(`ts-node --esm ${errorHandlerFixture} --project './tsconfig.jest.json'`, error => {
      expect(error?.toString()).toMatch(/Error/)
      done()
    })
  })
})
