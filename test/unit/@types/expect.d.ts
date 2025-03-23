import "vitest"

interface CustomMatchers<R = unknown> {
    toHaveInProtoChain(...chain: Constructor[]): R
    toBeNil(): R
    toBeObject(): R
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
