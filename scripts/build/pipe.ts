import { Transform } from 'stream'
import vs from 'vinyl-string'
import fs from 'fs'
import type { TaskFunction } from 'gulp'
import type File from 'vinyl'

type Transformer = () => Transform
function isPipeable(_: TaskFunction): _ is Transformer {
  return true
}

/**
 * Get a string transformed to a Vinyl file
 *
 * Takes a string to transform to a Vinyl object, what its file path would be
 * if it had been a file, and the lazypipe function. It returns a promise that
 * will reject on error, or resolve with the Vinyl file.
 *
 * @param input - String contents of the "file"
 * @param path  - The "path" of the "file"
 * @param fn - The lazypipe that will be used to transform the input, usually the SUT
 *
 * @returns Vinyl file representing the original `input` and `path`, transformed by the `func`
 */
export const pipeFile = (input: string, path: string, fn: TaskFunction): Promise<string[]> => {
  if (!isPipeable(fn)) throw new Error()
  const nullWriteStream = fs.createWriteStream('/dev/null')
  const results: string[] = []

  const vinylFileContentCollector = new Transform({
    objectMode: true,
    transform (file: File, _, done) {
      if (file.contents instanceof Buffer) results.push(file.contents.toString())
      done(undefined, file.contents?.toString())
    }
  })

  return new Promise((resolve, reject) => {
    vs(input, { path })
      .pipe(fn()) // NodeJS.WritableStream
      .pipe(vinylFileContentCollector)
      .pipe(nullWriteStream)
      .on('finish', () => resolve(results))
      .on('error', reject)
  })
}
