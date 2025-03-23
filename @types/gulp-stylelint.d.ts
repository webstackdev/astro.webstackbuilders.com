declare module 'gulp-stylelint' {
  import type { LinterOptions } from 'stylelint'
  type StylelintOptions = LinterOptions & {
    /** Common path for all reporters */
    reportOutputDir?: string
    /** Reporter configurations */
    reporters?: {
      formatter?: 'string' | 'verbose' | 'json'
      /** Display output on console */
      console?: boolean
    }[]
    /** If true, the process will end with non-zero error code if any error raised */
    failAfterError?: boolean
    /** If true, error stack will be printed */
    debug?: boolean
  }
  // Returns object stream usable in Gulp pipes
  function gulpStylelint(options: StylelintOptions): NodeJS.ReadWriteStream
  export default gulpStylelint
}
