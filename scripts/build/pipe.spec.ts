import { describe, expect, test } from '@jest/globals'
import lazypipe from 'lazypipe'
import stream from 'stream'
import { pipeFile } from './pipe'
import type File from 'vinyl'

function vinylFilePassthrough() {
  const transformStream = new stream.Transform({ objectMode: true })
  transformStream._transform = function (file: File, _, callback) {
    callback(undefined, file)
  }
  return transformStream
}

const testTask = lazypipe().pipe(vinylFilePassthrough)

describe(`Pipe fixture for testing lazypipe stacks works`, () => {
  test('lazypipe stack executes', async () => {
    const sut = await pipeFile(`test input`, `./`, testTask)
    expect(sut).toBeInstanceOf(Array)
    expect(sut).toHaveLength(1)
    expect(sut[0]).toMatch(/test input/)
  })
})
