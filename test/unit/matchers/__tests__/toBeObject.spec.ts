/// <reference path="../../../../@types/@jest/globals/expect.d.ts" />
/**
 * From 'jest-extended', but that library does not compile due to bad typings
 */
import { describe, expect, test } from '@jest/globals'

describe('.toBeObject', () => {
  test('passes when given an object', () => {
    expect({}).toBeObject()
  })

  test.each([[false], [''], [0], [() => {}], [undefined], [NaN], [[1, 2, 3]]])(
    'fails when not given an object: %s',
    given => {
      expect(() => expect(given).toBeObject()).toThrowErrorMatchingSnapshot()
    }
  )
})

describe('.not.toBeObject', () => {
  test.each([[false], [''], [0], [() => {}], [undefined], [NaN], [[1, 2, 3]]])(
    'passes when not given an object: %s',
    given => {
      expect(given).not.toBeObject()
    }
  )

  test('fails when given an object', () => {
    expect(() => expect({}).not.toBeObject()).toThrowErrorMatchingSnapshot()
  })
})
