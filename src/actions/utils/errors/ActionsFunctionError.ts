const DEFAULT_ERROR_MESSAGE = 'Internal server error'
const MIN_ERROR_STATUS = 400
const MAX_ERROR_STATUS = 599
const DEFAULT_ERROR_STATUS = 500
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504])

export interface ActionsFunctionErrorParams {
  message: string
  stack?: string | undefined
  cause?: unknown
  status?: number | undefined
  code?: string | undefined
  route?: string | undefined
  operation?: string | undefined
  requestId?: string | undefined
  correlationId?: string | undefined
  details?: Record<string, unknown> | undefined
  retryable?: boolean | undefined
}

const cloneDetails = (details?: Record<string, unknown>): Record<string, unknown> | undefined =>
  details ? { ...details } : undefined

const normalizeStatus = (status?: number): number => {
  if (typeof status !== 'number' || Number.isNaN(status)) {
    return DEFAULT_ERROR_STATUS
  }

  const truncated = Math.trunc(status)
  if (truncated < MIN_ERROR_STATUS) {
    return MIN_ERROR_STATUS
  }
  if (truncated > MAX_ERROR_STATUS) {
    return DEFAULT_ERROR_STATUS
  }

  return truncated
}

const isRetryableStatus = (status: number): boolean => RETRYABLE_STATUS_CODES.has(status)

function normalizeActionsFunctionError(message: unknown): ActionsFunctionErrorParams {
  if (message instanceof ActionsFunctionError) {
    return message.toParams()
  }

  if (message instanceof Error) {
    return {
      message: message.message || DEFAULT_ERROR_MESSAGE,
      stack: message.stack,
      cause: message.cause,
    }
  }

  if (typeof message === 'string') {
    const normalized = message.trim()
    return { message: normalized || DEFAULT_ERROR_MESSAGE }
  }

  if (message && typeof message === 'object') {
    const params = message as Partial<ActionsFunctionErrorParams>
    return {
      message:
        typeof params.message === 'string' && params.message.trim()
          ? params.message.trim()
          : DEFAULT_ERROR_MESSAGE,
      stack: params.stack,
      cause: params.cause,
      status: params.status,
      code: params.code,
      route: params.route,
      operation: params.operation,
      requestId: params.requestId,
      correlationId: params.correlationId,
      details: cloneDetails(params.details),
      retryable: params.retryable,
    }
  }

  if (message === undefined || message === null) {
    return { message: DEFAULT_ERROR_MESSAGE }
  }

  return { message: String(message) }
}

export class ActionsFunctionError extends Error {
  status: number
  isClientError: boolean
  isServerError: boolean
  retryable: boolean
  code?: string | undefined
  route?: string | undefined
  operation?: string | undefined
  requestId?: string | undefined
  correlationId?: string | undefined
  details?: Record<string, unknown> | undefined

  constructor(message?: unknown, context?: Partial<ActionsFunctionErrorParams>) {
    const normalized = normalizeActionsFunctionError(message)
    const merged: ActionsFunctionErrorParams = {
      ...normalized,
      ...(context || {}),
    }

    super(merged.message)

    Object.defineProperty(this, 'name', {
      value: 'ActionsFunctionError',
      enumerable: false,
      configurable: true,
    })

    Object.setPrototypeOf(this, new.target.prototype)

    if ('captureStackTrace' in Error) Error.captureStackTrace(this, ActionsFunctionError)
    if ('stackTraceLimit' in Error) Error.stackTraceLimit = Infinity

    this.message = merged.message
    this.cause = merged.cause
    this.status = normalizeStatus(merged.status)
    this.isClientError = this.status >= MIN_ERROR_STATUS && this.status < DEFAULT_ERROR_STATUS
    this.isServerError = this.status >= DEFAULT_ERROR_STATUS
    this.retryable =
      typeof merged.retryable === 'boolean' ? merged.retryable : isRetryableStatus(this.status)
    this.code = merged.code
    this.route = merged.route
    this.operation = merged.operation
    this.requestId = merged.requestId
    this.correlationId = merged.correlationId
    this.details = cloneDetails(merged.details)
  }

  static from(error: unknown, overrides?: Partial<ActionsFunctionErrorParams>): ActionsFunctionError {
    if (error instanceof ActionsFunctionError) {
      return new ActionsFunctionError(error.toParams(), overrides)
    }
    return new ActionsFunctionError(error, overrides)
  }

  toParams(): ActionsFunctionErrorParams {
    return {
      message: this.message,
      stack: this.stack,
      cause: this.cause,
      status: this.status,
      code: this.code,
      route: this.route,
      operation: this.operation,
      requestId: this.requestId,
      correlationId: this.correlationId,
      details: cloneDetails(this.details),
      retryable: this.retryable,
    }
  }

  getSafeMessage(fallbackMessage = DEFAULT_ERROR_MESSAGE): string {
    return this.isClientError ? this.message : fallbackMessage
  }
}
