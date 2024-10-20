/// <reference path="../../../../@types/@jest/globals/expect.d.ts" />
/**
 * Tests for custom matchers
 */
import { describe, expect, test } from '@jest/globals'
import { inProtoChain } from '../toHaveInProtoChain'
//import { isSyncExpectationResult, type SyncExpectationResult } from '../assertions'

describe(`inProtoChain helper method works`, () => {
  test(`inProtoChain returns true for child class`, () => {
    class ParentClass {}
    class ChildClass extends ParentClass {}
    const sut = inProtoChain(ChildClass, ParentClass)
    expect(sut).toBeTruthy()
  })

  test(`inProtoChain returns true for grandchild class`, () => {
    class ParentClass {}
    class ChildClass extends ParentClass {}
    class GrandchildClass extends ChildClass {}
    const sut = inProtoChain(GrandchildClass, ParentClass)
    expect(sut).toBeTruthy()
  })

  test(`inProtoChain returns false for child class in parent class prototype chain`, () => {
    class ParentClass {}
    class ChildClass extends ParentClass {}
    const sut = inProtoChain(ParentClass, ChildClass)
    expect(sut).toBeFalsy()
  })

  test(`inProtoChain returns false for unrelated classes`, () => {
    class ClassOne {}
    class ClassTwo {}
    const sut = inProtoChain(ClassOne, ClassTwo)
    expect(sut).toBeFalsy()
  })
})

describe(`toHaveInProtoChain custom matcher works`, () => {
  test(`toHaveInProtoChain checks full chain`, () => {
    class ParentClass {}
    class ChildClass extends ParentClass {}
    class GrandchildClass extends ChildClass {}

    expect(GrandchildClass).toHaveInProtoChain(ChildClass, ParentClass)
  })

  test(`toHaveInProtoChain returns false for unrelated classes`, () => {
    class ClassOne {}
    class ClassTwo {}

    expect(ClassOne).not.toHaveInProtoChain(ClassTwo)
  })
})
