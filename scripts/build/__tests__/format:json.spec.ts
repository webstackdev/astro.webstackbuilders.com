import { describe, expect, test } from '@jest/globals'
import { pipeFile } from '../pipe'
import { formatJsonTask } from '../tasks/format:json'

// These tests all need fixed that are trying to use a testing harness for the lazypipe stack
describe(`Formats JSON files files`, () => {
  test(`Passes over valid JSON`, async () => {
    const testJson = '{ "myKey": "myValue" }'
    const sut = await pipeFile(testJson, 'tests.json', formatJsonTask)
    expect(sut).toBeInstanceOf(Array)
    expect(sut).toHaveLength(1)
  })
})
