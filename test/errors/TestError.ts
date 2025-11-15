/**
 * Custom error class for unit test errors
 */
export class TestError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    /**
     * Set error name as constructor name and make it not enumerable to
     * keep native Error behavior
     */
    Object.defineProperty(this, 'name', {
      value: 'TestError',
      enumerable: false,
      configurable: true,
    })
    /** Fix the extended error prototype chain because Typescript __extends can't */
    Object.setPrototypeOf(this, new.target.prototype)
    /** Remove constructor from stack trace in V8 */
    if ('captureStackTrace' in Error) Error.captureStackTrace(this, TestError)
  }
}
