/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
  test: {
    // avoid globals imports (assert, describe, expect, test)
    globals: true,
    include: ['src/**/*.spec.ts?(x)'],
  },
})
