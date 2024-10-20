/**
 * The PromiseRejectionEvent constructor is a Web API and not provided by JSDOM
 *
 * @see [PromiseRejectionEvent is not defined](https://github.com/jsdom/jsdom/issues/2401)
 */
export type PromiseRejectionEventTypes = 'rejectionhandled' | 'unhandledrejection'

export interface PromiseRejectionEventInit extends EventInit {
  promise: Promise<unknown>
  reason?: unknown
}

export class PromiseRejectionEvent extends Event {
  public readonly promise: Promise<unknown>
  public readonly reason: unknown

  public constructor(type: PromiseRejectionEventTypes, options: PromiseRejectionEventInit) {
    super(type)

    this.promise = options.promise
    this.reason = options.reason
  }
}
