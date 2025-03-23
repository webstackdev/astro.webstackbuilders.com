// Type definitions for service-worker-mock 2.05
/**
 * Pinterest's Service Worker Mock adds globals with the service worker
 * executed in a Node environment.
 */
export {}

declare global {
  namespace NodeJS {
    interface Global {
      /**
       * A key/value map of active listeners (`install`/`activate`/`fetch`/etc).
       */
      listeners: Listeners,

      /**
       * Used to trigger active listeners.
       */
      /** @NOTE: Have to manually keep method overloads in sync with SWM definition in ./index.d.ts */
      trigger(type: ServiceWorkerGlobalScopeEvents): Promise<void>,
      trigger(name: 'fetch', request: string | Request): Promise<void>,
      trigger(
        name: 'notificationclick' | 'notificationclose',
        args: Notification
      ): Promise<void>,
      trigger(name: 'push', args: Partial<PushEvent>): Promise<void>,
      trigger(name: 'message', args: Partial<MessageEvent>): Promise<void>,

      /**
       * Used to generate a snapshot of the service worker internals.
       */
      snapshot(): Snapshot,
    }
  }
}
