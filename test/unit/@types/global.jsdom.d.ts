/**
 * Merge project declarations with global DOM types
 */
import type { ListenerState } from '../environment/state'
import type { WorkerPool } from '../environment/workerpool'

/* eslint-disable no-var */
declare global {
  // `globalThis` gives "Unknown keyword of identifier. Did you mean 'global This'?"
  /** Accessible both as `window.JSDOM_QUIET_MODE` as well as `JSDOM_QUIET_MODE` directly */
  var JSDOM_QUIET_MODE: boolean | undefined
  /** State to manage decorators for add and remove event listeners */
  var EVENT_LISTENER_STATE: ListenerState | undefined
  /** State to manage decorators for add and remove event listeners */
  var WORKER_POOL: WorkerPool | undefined
  /** Merge this interface definition with the Window interface defined in lib.dom.d.ts */
  interface Window {
    /** `JSDOMEnvironment` assumes `Window` interface has `Error.stackTraceLimit` */
    Error: {
      stackTraceLimit: number
    }
  }
}
/* eslint-enable no-var */
