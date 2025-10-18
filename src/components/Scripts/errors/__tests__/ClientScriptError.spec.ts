/**
 * Tests for error handling routines and custom errors
 */
import { describe, expect, test } from 'vitest'
import type { Constructor } from '@test/unit/matchers/assertions'
import { ClientScriptError } from '../ClientScriptError'
import { isClientScriptError } from '../assertions'

describe(`ClientScriptError class is constructible`, () => {
  test(`Class is properly constructed`, () => {
    try {
      throw new ClientScriptError(`It went bad!`)
    } catch (err) {
      if (!isClientScriptError(err)) throw new Error()
      // The name property should be set to the error`s name
      expect(err.name).toBe(`ClientScriptError`)

      // The error should be an instance of its class
      expect(err).toBeInstanceOf(ClientScriptError)

      // The error should be an instance of builtin Error
      expect(err).toBeInstanceOf(Error)

      // toString should return the default error message formatting
      expect(err.toString()).toBe(`ClientScriptError: It went bad!`)

      // The error should have recorded a stack
      expect(err.stack).toEqual(expect.any(String))
    }
  })
})

describe(`ClientScriptError has proper inheritance and props set`, () => {
  test(`Instance`, () => {
    expect(ClientScriptError).toHaveInProtoChain(Error as Constructor)
  })

  test(`Extended`, () => {
    class SubError extends ClientScriptError {}
    const sut = new SubError(`test message`)
    expect(SubError).toHaveInProtoChain(Error as Constructor, ClientScriptError)
    //expect(sut).toHaveProperty(`name`, `SubError`)
    expect(sut).toHaveProperty(`message`, `test message`)
  })

  test(`Extended with constructor`, () => {
    class HttpError extends ClientScriptError {
      constructor(
        public code: number,
        message?: string
      ) {
        super(message)
      }
    }
    const sut = new HttpError(404, `test message`)
    expect(HttpError).toHaveInProtoChain(Error as Constructor, ClientScriptError)
    //expect(sut).toHaveProperty(`name`, `HttpError`)
    expect(sut).toHaveProperty(`message`, `test message`)
    expect(sut).toHaveProperty(`code`, 404)
  })

  test(`Extended with name`, () => {
    class RenamedError extends ClientScriptError {
      constructor(name: string, message?: string) {
        super(message)
        Object.defineProperty(this, `name`, { value: name })
      }
    }
    const sut = new RenamedError(`test`, `test message`)
    expect(RenamedError).toHaveInProtoChain(Error as Constructor, ClientScriptError)
    expect(sut).toHaveProperty(`name`, `test`)
    expect(sut).toHaveProperty(`message`, `test message`)
  })
})

describe(`ClientScriptError construction works with new`, () => {
  test(`Basic properties`, () => {
    const sut = new ClientScriptError(`test message`)
    expect(sut).toHaveProperty(`name`, `ClientScriptError`)
    expect(sut).toHaveProperty(`message`, `test message`)
  })

  test(`Without message`, () => {
    const sut = new ClientScriptError()
    expect(sut).toHaveProperty(`name`, `ClientScriptError`)
    expect(sut).toHaveProperty(`message`, ``)
  })
})

describe(`toString behavior in logging`, () => {
  test(`Outputs error with message when coerced to string`, () => {
    expect(`${new ClientScriptError(`Hello`)}`).toMatch(`ClientScriptError: Hello`)
  })
})

describe(`toJSON behavior overridden`, () => {
  test(`Outputs structured JSON error with toJSON`, () => {
    const sut = new ClientScriptError(`test message`)
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
