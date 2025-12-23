/// <reference types="astro/client" />

type RequestIdleCallbackHandle = number

interface IdleDeadline {
  didTimeout: boolean
  timeRemaining(): number
}

type IdleRequestCallback = (_deadline: IdleDeadline) => void

interface IdleRequestOptions {
  timeout?: number
}

declare function requestIdleCallback(
  _callback: IdleRequestCallback,
  _options?: IdleRequestOptions,
): RequestIdleCallbackHandle

declare function cancelIdleCallback(_handle: RequestIdleCallbackHandle): void

interface ImportMetaEnv {
  readonly NODE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
