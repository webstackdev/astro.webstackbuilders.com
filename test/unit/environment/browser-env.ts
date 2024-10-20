/// <reference path="../@types/global.jsdom.d.ts" />
/**
 * Custom Jest environment to add globals. Environment setup/teardown methods here
 *  are executed before/after every test file in its own environment. Added as a
 * testEnvironment in test/jest/jest.config.jsdom.ts
 */
import { clearImmediate, setImmediate } from 'timers'
import { TextDecoder, TextEncoder } from 'util'
import { Event as CircusEvent, State as CircusState } from 'jest-circus'
import { ModuleMocker } from 'jest-mock'
import { installCommonGlobals } from 'jest-util'
import { JSDOM } from 'jsdom'
import type { Context } from 'vm'
import type {
  EnvironmentContext,
  JestEnvironment,
  JestEnvironmentConfig
} from '@jest/environment'
import type { LegacyFakeTimers, ModernFakeTimers } from '@jest/fake-timers'
import type { Global } from '@jest/types'
import { getJsdomQuietModeFlag } from '../jsdomQuietMode'
import { getJsdomInstance } from './jsdomEnv'
import {
  getCustomExportConditions,
  getLegacyFakeTimers,
  getModernFakeTimers
} from './helpers'
import * as listeners from './listeners'
import { ListenerState } from './state'
import { WorkerPool } from '../helpers/workers/pool'

export const isJsdomSetOnGlobal = () => {
  /* eslint-disable-next-line no-null/no-null */
  if (globalThis === null) throw new Error('JSDOM did not return a Window object')
}

/**
 * Custom Jest JSDOM environment that resets the complete environment between test
 * cases if `addEventListener` is mocked, and otherwise tracks event listeners and
 * other DOM items to clean up between tests using `beforeEach` and `afterEach`
 * in Jest setup file for JSDOM.
 */
/* eslint-disable no-null/no-null, @typescript-eslint/require-await */
export default class JSDomTscompileEnvironment implements JestEnvironment<number> {
  /**
   * Used to set the global object available in sandboxed test suites. Type
   * forced by base interface, would be easier if it was `typeof globalThis`.
   */
  global: Global.Global
  fakeTimers: LegacyFakeTimers<number> | null
  fakeTimersModern: ModernFakeTimers | null
  moduleMocker: ModuleMocker | null
  /** JSDOM-specific environment properties */
  dom: JSDOM | null
  /**
   * Expose helpers per runner that the user can call during unit tests by attaching
   * a static method to the runner class that is callable from within the tests.
   */
  private errorEventListener: ((event: Event & { error: Error }) => void) | null
  /** State for `exportConditions()` class method set from `projectConfig` */
  customExportConditions: string[]
  /**
   * Quiet mode to silence JSDOM's virtual console output and avoid
   * a wall of red output on tests that are intended to throw.
   */
  jsdomQuietMode: boolean
  /** Global state for resetting event listeners between tests */
  eventListenerState: ListenerState
  /** Global state for workers used in tests */
  workerPool: WorkerPool

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    const { projectConfig } = config
    const { globals: projectGlobalsToInstall, testEnvironmentOptions } = projectConfig

    /**
     * One JSDOM instance per test file
     */
    this.dom = getJsdomInstance(context.console, testEnvironmentOptions)

    /**
     * GLOBAL HANDLING CODE
     */

    /**
     * In browsers, `document.defaultView` returns the window object associated
     * with a document, or null if none is available. The `jsdom.jsdom` function
     * returns `window.document` and to use the window it is necessary to use
     * `window.document.defaultView` which normally references the first window.
     *
     * From Jest documentation on `testEnvironment` Config option, used to pass
     * the path to this custom environment:  "You can also pass variables from this
     * module to your test suites by assigning them to `this.global` object. This
     * will make them available in your test suites as global variables."
     */
    this.global = this.dom.window.document.defaultView as unknown as Global.Global
    /**
     * Will throw a reference error if global is assigned to before the const declaration
     * but is a also still the "universal" global object after the const declaration.
     * */
    const global = this.global
    /** Throws if JSDOM isn't set on the `globalThis` object */
    isJsdomSetOnGlobal()
    /** For third-party code using `global` instead of `globalThis` */
    global.global = global as unknown as typeof globalThis
    /** Global symbols for Jest's internal use inside the sandboxed environment */
    installCommonGlobals(global as unknown as typeof globalThis, projectGlobalsToInstall)
    /** Maybe unnecessary */
    global.Buffer = Buffer
    /** Error-message stack size is set by default to 10 */
    global.Error.stackTraceLimit = 100

    /**
     * EVENT HANDLER GETTERS AND SETTERS
     */

    /**
     * Provide a default error handler if no client-provided error handlers added. Set
     * before ListenerState is initialized so that the default error handler isn't tracked.
     */
    this.errorEventListener = listeners.errorEventListener
    global.addEventListener('error', listeners.errorEventListener)

    /**
     * Initialize listener state that's used to track event handlers added and removed
     * so that the JSDOM environment can be reset between test cases without re-initializing
     * JSDOM which incurs a 100 ms penalty per instantiation.
     */
    this.eventListenerState = new ListenerState(global as unknown as Window, global.document)
    /** Set as global in both Jest runner and test environment realms */
    global.EVENT_LISTENER_STATE = this.eventListenerState
    Object.assign(globalThis, {
      EVENT_LISTENER_STATE: this.eventListenerState,
    })

    /**
     * Initialize worker pool state for workers that need a Node environment inside a
     * JSDOM test environment.
     */
    this.workerPool = new WorkerPool()
    /** Set as global in both Jest runner and test environment realms */
    global.WORKER_POOL = this.workerPool
    Object.assign(globalThis, {
      WORKER_POOL: this.workerPool,
    })

    /**
     * Set up tracking Window and Document add and remove event listeners
     */
    global.addEventListener = listeners.wrapWindowAddEventListener.bind(this)
    global.document.addEventListener = listeners.wrapDocumentAddEventListener.bind(this)

    /**
     * SET INHERITED CLASS PROPERTIES
     */
    this.customExportConditions = getCustomExportConditions(testEnvironmentOptions)
    this.moduleMocker = new ModuleMocker(global as unknown as typeof globalThis)
    this.fakeTimers = getLegacyFakeTimers(
      global as unknown as typeof globalThis,
      projectConfig,
      this.moduleMocker
    )
    this.fakeTimersModern = getModernFakeTimers(
      global as unknown as typeof globalThis,
      projectConfig
    )

    /**
     * SET GLOBAL STATE
     */
    this.jsdomQuietMode = getJsdomQuietModeFlag(context)
    /** Set as global in both Jest runner and test environment realms */
    global.JSDOM_QUIET_MODE = this.jsdomQuietMode
    Object.assign(globalThis, {
      JSDOM_QUIET_MODE: this.jsdomQuietMode,
    })
  }

  /** Runs before each test file */
  async setup(): Promise<void> {
    /**
     * Not defined in JSDOM environment but needed by test helpers that call Eleventy and Webpack
     */
    this.global.clearImmediate = clearImmediate
    this.global.setImmediate = setImmediate

    /**
     * Polyfill to provide TextEncoder and TextDecoder for JSDom
     */
    this.global.TextEncoder = TextEncoder
    // @ts-ignore util type definition does not match global type definition but they're the same
    this.global.TextDecoder = TextDecoder
  }

  /** Runs after each test file */
  async teardown(): Promise<void> {
    await this.workerPool.cleanup()

    if (this.fakeTimers) this.fakeTimers.dispose()
    if (this.fakeTimersModern) this.fakeTimersModern.dispose()

    if (this.global !== null) {
      if (this.errorEventListener) {
        this.global.removeEventListener('error', this.errorEventListener)
      }

      /**
       * Window.close() method closes the current window. Can only be called
       * on windows that were opened by a script using Window.open().
       */
      this.global.close()

      /**
       * Dispose "document" to prevent "load" event from triggering. Note that
       * this.global.close() will trigger the CustomElement::disconnectedCallback.
       * Do not reset the document before CustomElement disconnectedCallback function
       * has finished running, document should be accessible within disconnectedCallback.
       * The 'document' property configurable descriptor is set to false so can't use
       * Object.defineProperty to set value.
       */
      this.global.document = null as unknown as Document
    }

    this.errorEventListener = null
    // @ts-ignore type this.global in extended interface not allowed to be `null`
    this.global = null
    this.dom = null
    this.fakeTimers = null
    this.fakeTimersModern = null

    global.EVENT_LISTENER_STATE = undefined
    Object.assign(globalThis, {
      EVENT_LISTENER_STATE: undefined,
    })

    global.JSDOM_QUIET_MODE = undefined
    Object.defineProperty(globalThis, 'JSDOM_QUIET_MODE', {
      writable: true,
      value: undefined,
    })
  }

  /**
   * Should return an array of conditions that will be passed along with Jest's
   * defaults to custom module path resolver functions specified in Jest config.
   */
  exportConditions(): Array<string> {
    return this.customExportConditions
  }

  /**
   * Mandatory to export starting from Jest 27. ES Modules are only supported
   * if the test environment has the `getVmContext` function.
   */
  getVmContext(): Context | null {
    if (this.dom) {
      return this.dom.getInternalVMContext()
    }
    return null
  }

  // @TODO: Move the beforeEach / afterEach from jest.setup.jsdom.ts to here so the environment can be packaged separately. Not sure if the hooks are called if no beforeEach / afterEach methods are defined, or how to tell between the multiple beforeEach calls in the current setup.
  async handleTestEvent(event: CircusEvent, _: CircusState) {
    if (event.name === 'hook_start') {
      if (`beforeEach` === event.hook.type) {
        //
      } else if (`afterEach` === event.hook.type) {
        //
      }
    }
  }
}
/* eslint-enable no-null/no-null, @typescript-eslint/require-await */

/*
// Example output from 'event.hook':
hook_start, hook: beforeEach
<ref *1> {
  asyncError: ErrorWithStack
      at jestAdapter (/home/kevin/Repos/webstackdev/eleventy.webstackbuilders.com/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:44:11)
      ...
  fn: [Function (anonymous)],
  parent: {
    type: 'describeBlock',
    children: [ [Object] ],
    hooks: [ [Circular *1], [Object], [Object] ],
    mode: undefined,
    name: 'ROOT_DESCRIBE_BLOCK',
    parent: undefined,
    tests: []
  },
  seenDone: false,
  timeout: undefined,
  type: 'beforeEach'
}

hook_start, hook: beforeEach
<ref *1> {
  asyncError: ErrorWithStack
      at Object.<anonymous> (/home/kevin/Repos/webstackdev/eleventy.webstackbuilders.com/test/jest/jest.setup.jsdom.ts:42:11)
      ...
  type: 'beforeEach'
}
*/
