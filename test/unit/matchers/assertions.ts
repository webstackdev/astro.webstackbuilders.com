/**
 * Custom test matchers and type definitions for error tests
 */
// Make Constructor type more flexible to accept any constructor signature
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor = new (..._args: any[]) => object

/**
 * Custom matchers interface for vitest
 */
interface CustomMatchers<R = unknown> {
  toHaveInProtoChain(..._constructors: Constructor[]): R
  toBeNil(): R
  toBeObject(): R
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends CustomMatchers<T> {
    // Add placeholder property to satisfy TypeScript interface requirements
    readonly __customMatchers: true
  }
  interface AsymmetricMatchersContaining extends CustomMatchers {
    // Extending existing AsymmetricMatchersContaining interface with custom matchers
    not: Omit<AsymmetricMatchersContaining, 'not'>
  }
}

/**
 * Check if a constructor has expected constructors in its prototype chain
 */
function toHaveInProtoChain(received: Constructor, ...expected: Constructor[]) {
  const prototype = received.prototype

  for (const constructor of expected) {
    if (!(prototype instanceof constructor)) {
      return {
        message: () => `expected ${received.name} to have ${constructor.name} in prototype chain`,
        pass: false
      }
    }
  }

  return {
    message: () => `expected ${received.name} not to have prototype chain`,
    pass: true
  }
}

/**
 * Check if value is null or undefined
 */
function toBeNil(received: unknown) {
  const pass = received === null || received === undefined
  return {
    message: () => pass
      ? `expected ${received} not to be nil (null or undefined)`
      : `expected ${received} to be nil (null or undefined)`,
    pass
  }
}

/**
 * Check if value is an object
 */
function toBeObject(received: unknown) {
  const pass = typeof received === 'object' && received !== null
  return {
    message: () => pass
      ? `expected ${received} not to be an object`
      : `expected ${received} to be an object`,
    pass
  }
}

export {
  toHaveInProtoChain,
  toBeNil,
  toBeObject
}