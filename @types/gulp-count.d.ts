declare module 'gulp-count' {
  /* eslint-disable tsdoc/syntax */
  interface Options {
    /**
     * Passed to gulp-util template method
     *
     * @default '<%= files %>'
     */
    message: boolean | string
    /**
     * Whether to log each file path as it is encountered
     *
     * @default false
     */
    logFiles: boolean
    /**
     * Whether to log the message when the stream is empty
     *
     * @default false
     */
    logEmpty: boolean
    /**
     * String prepended to every message to distinguish the output of multiple
     * instances logging at once. A falsy value will print nothing.
     */
    title: string
    /**
     * Current working directory against which file paths are resolved in template strings.
     *
     * @default ""
     */
    cwd: string
    /**
     * Set custom logger
     *
     * @default gutil.log
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger: (message: string) => any
  }
  /* eslint-enable tsdoc/syntax */
  // Returns object stream usable in Gulp pipes
  function count(message: string, options?: Options): NodeJS.ReadWriteStream
  function count(options: Options): NodeJS.ReadWriteStream
  export default count
}
