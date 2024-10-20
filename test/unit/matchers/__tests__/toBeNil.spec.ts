/// <reference path="../../../../@types/@jest/globals/expect.d.ts" />
/**
 * From 'jest-extended', but that library does not compile due to bad typings
 */
import { describe, expect, test } from '@jest/globals'

describe('.toBeNil', () => {
  test('passes when null is given', () => {
    /* eslint-disable-next-line no-null/no-null */
    expect(null).toBeNil()
  })

  test('passes when undefined is given', () => {
    expect(undefined).toBeNil()
  })
  test('fails when the value is not null or undefined', () => {
    expect(() => expect('value').toBeNil()).toThrowErrorMatchingSnapshot()
  })
})

describe('.not.toBeNil', () => {
  test.each([['true'], [{}], [true]])('passes when value is not null or undefined : %s', given => {
    expect(given).not.toBeNil()
  })

  test('fails when null is given', () => {
    /* eslint-disable-next-line no-null/no-null */
    expect(() => expect(null).not.toBeNil()).toThrowErrorMatchingSnapshot()
  })
})
