/**
 * Tests for error handling routines and custom errors
 */
import { describe, expect, test } from 'vitest'
import { BuildError, isBuildError } from '@lib/errors/BuildError'

describe(`BuildError class is constructible`, () => {
  test(`Class is properly constructed`, () => {
    try {
      throw new BuildError(`Test error`)
    } catch (err) {
      if (!isBuildError(err)) throw new Error()
      // The name property should be set to the error`s name
      expect(err.name).toBe(`BuildError`)

      // The error should be an instance of its class
      expect(err).toBeInstanceOf(BuildError)

      // The error should be an instance of builtin Error
      expect(err).toBeInstanceOf(Error)

      // toString should return the default error message formatting
      expect(err.toString()).toBe(`BuildError: Test error`)

      // The error should have recorded a stack
      expect(err.stack).toEqual(expect.any(String))
    }
  })
})

describe(`BuildError has proper inheritance and props set`, () => {
  test(`Instance`, () => {
    expect(BuildError).toHaveInProtoChain(Error)
  })

  test(`Extended`, () => {
    class SubError extends BuildError {}
    const sut = new SubError(`test message`)
    expect(SubError).toHaveInProtoChain(Error, BuildError)
    //expect(sut).toHaveProperty(`name`, `SubError`)
    expect(sut).toHaveProperty(`message`, `test message`)
  })

  test(`Extended with constructor`, () => {
    class HttpError extends BuildError {
      constructor(
        /* eslint-disable-next-line no-unused-vars */
        public code: number,
        message?: string
      ) {
        super(message)
      }
    }
    const sut = new HttpError(404, `test message`)
    expect(HttpError).toHaveInProtoChain(Error, BuildError)
    //expect(sut).toHaveProperty(`name`, `HttpError`)
    expect(sut).toHaveProperty(`message`, `test message`)
    expect(sut).toHaveProperty(`code`, 404)
  })

  test(`Extended with name`, () => {
    class RenamedError extends BuildError {
      constructor(name: string, message?: string) {
        super(message)
        Object.defineProperty(this, `name`, { value: name })
      }
    }
    const sut = new RenamedError(`test`, `test message`)
    expect(RenamedError).toHaveInProtoChain(Error, BuildError)
    expect(sut).toHaveProperty(`name`, `test`)
    expect(sut).toHaveProperty(`message`, `test message`)
  })
})

describe(`BuildError construction works with new`, () => {
  test(`Basic properties`, () => {
    const sut = new BuildError(`test message`)
    expect(sut).toHaveProperty(`name`, `BuildError`)
    expect(sut).toHaveProperty(`message`, `test message`)
  })

  test(`Without message`, () => {
    const sut = new BuildError()
    expect(sut).toHaveProperty(`name`, `BuildError`)
    expect(sut).toHaveProperty(`message`, ``)
  })

  test(`With build-specific properties`, () => {
    const sut = new BuildError(`test message`, {
      phase: 'compilation',
      tool: 'astro',
      exitCode: 1,
      filePath: '/src/test.ts',
      lineNumber: 10,
      columnNumber: 5
    })
    expect(sut).toHaveProperty(`name`, `BuildError`)
    expect(sut).toHaveProperty(`message`, `test message`)
    expect(sut.phase).toBe('compilation')
    expect(sut.tool).toBe('astro')
    expect(sut.exitCode).toBe(1)
    expect(sut.filePath).toBe('/src/test.ts')
    expect(sut.lineNumber).toBe(10)
    expect(sut.columnNumber).toBe(5)
  })
})

describe(`toString behavior in logging`, () => {
  test(`Outputs error with message when coerced to string`, () => {
    expect(`${new BuildError(`Hello`)}`).toMatch(`BuildError: Hello`)
  })
})

describe(`toJSON behavior overridden`, () => {
  test(`Outputs structured JSON error with toJSON`, () => {
    const sut = new BuildError(`test message`)
    expect(sut.toJSON()).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          message: expect.any(String),
          name: expect.any(String),
          stack: expect.any(String),
        }),
      })
    )
  })
})

describe(`Static factory methods`, () => {
  test(`compilation creates error with compilation phase`, () => {
    const sut = BuildError.compilation(
      `TypeScript compilation failed`,
      '/src/component.ts',
      15,
      5
    )
    expect(sut.message).toBe('TypeScript compilation failed')
    expect(sut.phase).toBe('compilation')
    expect(sut.filePath).toBe('/src/component.ts')
    expect(sut.lineNumber).toBe(15)
    expect(sut.columnNumber).toBe(5)
  })

  test(`fileOperation creates error with file-operation phase`, () => {
    const sut = BuildError.fileOperation(
      `Could not read config file`,
      '/astro.config.ts',
      'read'
    )
    expect(sut.message).toBe('Could not read config file')
    expect(sut.phase).toBe('file-operation')
    expect(sut.filePath).toBe('/astro.config.ts')
  })

  test(`bundling creates error with bundling phase`, () => {
    const sut = BuildError.bundling(
      `Bundling failed`,
      'vite',
      1
    )
    expect(sut.message).toBe('Bundling failed')
    expect(sut.phase).toBe('bundling')
    expect(sut.tool).toBe('vite')
    expect(sut.exitCode).toBe(1)
  })
})
