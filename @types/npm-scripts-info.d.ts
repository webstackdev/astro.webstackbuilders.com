declare module 'npm-scripts-info' {
  function info (pkg: { [key: string]: any }): { [key: string]: string }
  export default info
}
