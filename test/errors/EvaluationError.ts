/**
 * EvaluationError is used exclusively inside browser-evaluated test code
 * (e.g., Playwright page.evaluate callbacks). It mirrors TestError but is safe
 * to serialize into the client runtime so tests can signal precise failures
 * without leaking server-only utilities into production bundles.
 */
export class EvaluationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)

    Object.defineProperty(this, 'name', {
      value: 'EvaluationError',
      enumerable: false,
      configurable: true,
    })

    Object.setPrototypeOf(this, new.target.prototype)

    if ('captureStackTrace' in Error) {
      Error.captureStackTrace(this, EvaluationError)
    }
  }
}
