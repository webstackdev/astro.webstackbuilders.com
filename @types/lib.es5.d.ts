/** Built-in error type doesn't have V8-only methods and properties */
interface Error {
  cause?: unknown
}

interface ErrorConstructor {
  stackTraceLimit: number
  /* eslint-disable-next-line @typescript-eslint/ban-types */
  captureStackTrace(error: Error, errorConstructor: Function)
}
