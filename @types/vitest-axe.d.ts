/// <reference types="vitest" />
/* eslint-disable @typescript-eslint/no-empty-object-type, no-unused-vars, @typescript-eslint/no-unused-vars */
import type { AxeMatchers } from 'vitest-axe/matchers'

declare module 'vitest' {
  export interface Assertion<R extends void | Promise<void> = void, T = unknown> extends AxeMatchers {}
  export interface AsymmetricMatchersContaining extends AxeMatchers {}
}
