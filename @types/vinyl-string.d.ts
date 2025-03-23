declare module 'vinyl-string' {
  import type File from 'vinyl'
  import type { Transform } from 'stream'

  /**
   * @property keepOpen - Allow piping in to vFile.
   */
  type Options = { keepOpen?: boolean } & Partial<
    Pick<File, 'cwd' | 'base' | 'path' | 'history' | 'stat'>
  >
  function stringToVinylStream(rawContents: string | Buffer, options?: Options): Transform
  export default stringToVinylStream
}
