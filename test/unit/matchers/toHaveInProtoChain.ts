import type { MatcherFunction } from 'expect'
import { isConstructible, type Constructor } from './assertions'

export const inProtoChain = (BaseFn: Constructor, TestFn: Constructor) => {
  /* eslint-disable-next-line @typescript-eslint/ban-types */
  return (BaseFn as Function)?.prototype instanceof TestFn || BaseFn === TestFn
}

/**
 * Jest symmetric matcher to test if expected is in the prototype
 * chain of given constructor functions.
 *
 * @param expected - The constructor function to test its prototype chain for matches
 * @param chain - The constructor functions to check if they are in expected's prototype chain
 */
export const toHaveInProtoChain: MatcherFunction = function (expected: unknown, ...chain: unknown[]) {
  const errMssg = `Actual and all parameters to toHaveInProtoChain must be constructors`
  if (!isConstructible(expected)) throw new Error(errMssg)
  let pass = true
  let failedParamId = 0
  chain.forEach((testFn, step) => {
    if (!isConstructible(testFn)) throw new Error(errMssg)
    if (!inProtoChain(expected, testFn)) {
      pass = false
      failedParamId = step
    }
  })

  return {
    pass,
    message: pass
      ? () =>
          `Expected provided function not to be in prototype chain of actual, testing parameter number ${failedParamId}`
      : () =>
          `Expected provided function to be in prototype chain of actual, testing parameter number ${failedParamId}`,
  }
}
