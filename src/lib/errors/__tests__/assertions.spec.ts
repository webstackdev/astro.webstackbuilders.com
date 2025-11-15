// @vitest-environment happy-dom
/**
 * Tests for error assertions
 */
import { describe, expect, test } from 'vitest'
import { BuildError } from '@lib/errors/BuildError'
import {
  isString,
  isError,
  isErrorEvent,
  isBuildError
} from '@lib/errors/assertions'

describe(`Assertion for Error object`, () => {
  test(`Error object returns true in isError assertion`, () => {
    const sut = isError(new Error(`test error`))
    expect(sut).toBeTruthy()
  })

  test(`TypeError object returns false in isError assertion`, () => {
    const sut = isError(new TypeError())
    expect(sut).toBeFalsy()
  })
})

describe(`Assertion for ErrorEvent object`, () => {
  test(`ErrorEvent object returns true in isErrorEvent assertion`, () => {
    const sut = isErrorEvent(new ErrorEvent(`test error`))
    expect(sut).toBeTruthy()
  })

  test(`Error object returns false in isErrorEvent assertion`, () => {
    const sut = isErrorEvent(new Error())
    expect(sut).toBeFalsy()
  })
})

describe(`Assertion for BuildError object`, () => {
  test(`BuildError object returns true in isError assertion`, () => {
    const sut = isBuildError(new BuildError(`test error`))
    expect(sut).toBeTruthy()
  })

  test(`TypeError object returns false in isError assertion`, () => {
    const sut = isBuildError(new TypeError())
    expect(sut).toBeFalsy()
  })
})

describe(`Assertion for string values`, () => {
  test(`string primitive returns true in isString assertion`, () => {
    const sut = isString('hello world')
    expect(sut).toBeTruthy()
  })

  test(`String object returns true in isString assertion`, () => {
    const sut = isString(new String('hello world'))
    expect(sut).toBeTruthy()
  })

  test(`empty string returns true in isString assertion`, () => {
    const sut = isString('')
    expect(sut).toBeTruthy()
  })

  test(`number returns false in isString assertion`, () => {
    const sut = isString(123)
    expect(sut).toBeFalsy()
  })

  test(`null returns false in isString assertion`, () => {
    const sut = isString(null)
    expect(sut).toBeFalsy()
  })

  test(`undefined returns false in isString assertion`, () => {
    const sut = isString(undefined)
    expect(sut).toBeFalsy()
  })

  test(`array returns false in isString assertion`, () => {
    const sut = isString(['hello'])
    expect(sut).toBeFalsy()
  })

  test(`object returns false in isString assertion`, () => {
    const sut = isString({ text: 'hello' })
    expect(sut).toBeFalsy()
  })
})
