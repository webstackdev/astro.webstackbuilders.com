const DEFAULT_ERROR_MESSAGE = 'Internal server error'
const MIN_ERROR_STATUS = 400
const MAX_ERROR_STATUS = 599
const DEFAULT_ERROR_STATUS = 500
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504])

export interface ApiFunctionErrorParams {
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

function normalizeApiFunctionError(message: unknown): ApiFunctionErrorParams {
  if (message instanceof ApiFunctionError) {
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
    const params = message as Partial<ApiFunctionErrorParams>
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

export class ApiFunctionError extends Error {
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

  constructor(message?: unknown, context?: Partial<ApiFunctionErrorParams>) {
    const normalized = normalizeApiFunctionError(message)
    const merged: ApiFunctionErrorParams = {
      ...normalized,
      ...(context || {}),
    }

    super(merged.message)

    Object.defineProperty(this, 'name', {
      value: 'ApiFunctionError',
      enumerable: false,
      configurable: true,
    })

    Object.setPrototypeOf(this, new.target.prototype)

    if ('captureStackTrace' in Error) Error.captureStackTrace(this, ApiFunctionError)
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

  static from(error: unknown, overrides?: Partial<ApiFunctionErrorParams>): ApiFunctionError {
    if (error instanceof ApiFunctionError) {
      return new ApiFunctionError(error.toParams(), overrides)
    }
    return new ApiFunctionError(error, overrides)
  }

  toParams(): ApiFunctionErrorParams {
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

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        stack: this.stack,
        status: this.status,
        isClientError: this.isClientError,
        isServerError: this.isServerError,
        retryable: this.retryable,
        code: this.code,
        route: this.route,
        operation: this.operation,
        requestId: this.requestId,
        correlationId: this.correlationId,
        details: cloneDetails(this.details),
      },
    }
  }

  getSafeMessage(fallbackMessage = DEFAULT_ERROR_MESSAGE): string {
    return this.isClientError ? this.message : fallbackMessage
  }

  toResponseBody(options?: {
    fallbackMessage?: string
    includeDetails?: boolean
  }) {
    const fallbackMessage = options?.fallbackMessage ?? DEFAULT_ERROR_MESSAGE
    const includeDetails = options?.includeDetails ?? this.isClientError

    return {
      error: {
        status: this.status,
        code: this.code,
        message: this.getSafeMessage(fallbackMessage),
        ...(this.requestId && { requestId: this.requestId }),
        ...(this.correlationId && { correlationId: this.correlationId }),
        retryable: this.retryable,
        ...(includeDetails && this.details ? { details: cloneDetails(this.details) } : {}),
      },
    }
  }
}

export const normalizeUnknownApiError = (error: unknown, fallbackMessage = DEFAULT_ERROR_MESSAGE): Error => {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    const trimmed = error.trim()
    return new Error(trimmed || fallbackMessage)
  }

  if (error && typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string') {
      const trimmed = maybeMessage.trim()
      return new Error(trimmed || fallbackMessage)
    }
  }

  try {
    return new Error(JSON.stringify(error))
  } catch {
    return new Error(fallbackMessage)
  }
}
