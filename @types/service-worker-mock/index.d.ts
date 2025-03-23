// Type definitions for service-worker-mock 2.05
/**
 * Pinterest's Service Worker Mock adds globals with the service worker
 * executed in a Node environment. The DefinitelyTyped SWM types cannot
 * be augmented because it has a default export instead of a named export.
 * Exports can only be augmented by their exported name, and default is
 * a reserved word.
 */

declare module 'service-worker-mock' {
  function makeServiceWorkerEnv(): WorkerGlobalScope
  export = makeServiceWorkerEnv
}

interface Caches {
  [key: string]: Cache
}

type PushEvent = Event & {
  response: null
  _extendLifetimePromises: typeof Set
}

type ServiceWorkerGlobalScopeEvents =
  | 'install'
  | 'activate'
  | 'fetch'
  | 'message'
  | 'messageerror'
  | 'notificationclick'
  | 'notificationclose'
  | 'push'
type Listeners = Map<ServiceWorkerGlobalScopeEvents, EventListener>

interface Client {
  listeners: Listeners
  new ()
  addEventListener(type: string, listener: EventListener): void
  dispatchEvent(event: Event): void
  removeEventListener(): never
  resetEventListeners(): void
}

interface Snapshot {
  /**
   * A key/value map of current cache contents.
   */
  caches: Caches

  /**
   * A list of active clients.
   */
  clients: Client[]

  /**
   * A list of active notifications.
   */
  notifications: Notification[]
}

interface WorkerGlobalScope {
  listeners: Listeners

  /** @NOTE: Have to manually keep method overloads in sync with the global SWM definition */
  trigger(type: ServiceWorkerGlobalScopeEvents): Promise<void>
  trigger(name: 'fetch', request: string | Request): Promise<void>
  trigger(name: 'notificationclick' | 'notificationclose', args: Notification): Promise<void>
  trigger(name: 'push', args: Partial<PushEvent>): Promise<void>
  trigger(name: 'message', args: Partial<MessageEvent>): Promise<void>

  snapshot(): Snapshot
}
