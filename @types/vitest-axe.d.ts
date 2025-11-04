/// <reference types="vitest" />
/* eslint-disable @typescript-eslint/no-empty-object-type, no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import type { AxeMatchers } from 'vitest-axe/matchers'

declare module 'vitest' {
  export interface Assertion<T = any> extends AxeMatchers {}
  export interface AsymmetricMatchersContaining extends AxeMatchers {}
}
