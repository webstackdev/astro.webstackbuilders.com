import { describe, expect, test } from '@jest/globals'
import { pipeFile } from '../pipe'
import { buildSpritesTask } from '../tasks/build:sprites'

// These tests all need fixed that are trying to use a testing harness for the lazypipe stack
describe(`Build sprites creates a sprite file and CSS`, () => {
  test.skip(`Integration test for build sprites workflow`, async () => {
    const sut = await pipeFile(`<svg></svg>`, '.', buildSpritesTask)
    expect(sut).toBeInstanceOf(Array)
    expect(sut).toHaveLength(1)
    expect(sut).toMatchInlineSnapshot()
  })
})