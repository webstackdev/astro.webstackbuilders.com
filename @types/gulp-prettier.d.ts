declare module 'gulp-prettier' {
  import type { Options } from 'prettier'
  // Returns object stream usable in Gulp pipes
  function gulpPrettier(options: Options): NodeJS.ReadWriteStream
  export default gulpPrettier
}
