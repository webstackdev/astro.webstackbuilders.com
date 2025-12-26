import { ActionError, type ActionErrorCode } from 'astro:actions'

const DEFAULT_ERROR_MESSAGE = 'Internal server error'
const MIN_ERROR_STATUS = 400
const MAX_ERROR_STATUS = 599
const DEFAULT_ERROR_STATUS = 500
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504])

export interface ActionFunctionErrorParams {
  message: string
  stack?: string | undefined
  cause?: unknown
  status?: number | undefined
  appCode?: string | undefined
  route?: string | undefined
  operation?: string | undefined
  requestId?: string | undefined
  correlationId?: string | undefined
  details?: Record<string, unknown> | undefined
  retryable?: boolean | undefined
}

export type ActionsFunctionErrorParams = ActionFunctionErrorParams

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

const statusToCodeFallbackMap: Partial<Record<number, ActionErrorCode>> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  402: 'PAYMENT_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  406: 'NOT_ACCEPTABLE',
  407: 'PROXY_AUTHENTICATION_REQUIRED',
  408: 'REQUEST_TIMEOUT',
  409: 'CONFLICT',
  410: 'GONE',
  411: 'LENGTH_REQUIRED',
  412: 'PRECONDITION_FAILED',
  413: 'CONTENT_TOO_LARGE',
  414: 'URI_TOO_LONG',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  416: 'RANGE_NOT_SATISFIABLE',
  417: 'EXPECTATION_FAILED',
  421: 'MISDIRECTED_REQUEST',
  422: 'UNPROCESSABLE_CONTENT',
  423: 'LOCKED',
  424: 'FAILED_DEPENDENCY',
  425: 'TOO_EARLY',
  426: 'UPGRADE_REQUIRED',
  428: 'PRECONDITION_REQUIRED',
  429: 'TOO_MANY_REQUESTS',
  431: 'REQUEST_HEADER_FIELDS_TOO_LARGE',
  451: 'UNAVAILABLE_FOR_LEGAL_REASONS',
  500: 'INTERNAL_SERVER_ERROR',
  501: 'NOT_IMPLEMENTED',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
  505: 'HTTP_VERSION_NOT_SUPPORTED',
  506: 'VARIANT_ALSO_NEGOTIATES',
  507: 'INSUFFICIENT_STORAGE',
  508: 'LOOP_DETECTED',
  511: 'NETWORK_AUTHENTICATION_REQUIRED',
}

const statusToActionErrorCode = (status: number): ActionErrorCode => {
  const statusToCode = (ActionError as unknown as { statusToCode?: (_input: number) => ActionErrorCode }).statusToCode
  if (statusToCode) return statusToCode(status)
  return statusToCodeFallbackMap[status] ?? 'INTERNAL_SERVER_ERROR'
}

function normalizeActionFunctionError(message: unknown): ActionFunctionErrorParams {
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
    const params = message as Partial<ActionFunctionErrorParams>
    return {
      message:
        typeof params.message === 'string' && params.message.trim()
          ? params.message.trim()
          : DEFAULT_ERROR_MESSAGE,
      stack: params.stack,
      cause: params.cause,
      status: params.status,
      appCode: typeof params.appCode === 'string' ? params.appCode : (params as unknown as { code?: string }).code,
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

export class ActionsFunctionError extends ActionError {
  override status: number
  isClientError: boolean
  isServerError: boolean
  retryable: boolean
  appCode?: string | undefined
  route?: string | undefined
  operation?: string | undefined
  requestId?: string | undefined
  correlationId?: string | undefined
  details?: Record<string, unknown> | undefined

  constructor(message?: unknown, context?: Partial<ActionFunctionErrorParams>) {
    const normalized = normalizeActionFunctionError(message)
    const merged: ActionFunctionErrorParams = {
      ...normalized,
      ...(context || {}),
    }

    const status = normalizeStatus(merged.status)
    const code = statusToActionErrorCode(status)
    super({ code, message: merged.message })

    Object.defineProperty(this, 'name', {
      value: 'ActionsFunctionError',
      enumerable: false,
      configurable: true,
    })

    Object.setPrototypeOf(this, new.target.prototype)

    if ('captureStackTrace' in Error) Error.captureStackTrace(this, ActionsFunctionError)

    this.message = merged.message
    this.cause = merged.cause
    this.status = status
    this.isClientError = this.status >= MIN_ERROR_STATUS && this.status < DEFAULT_ERROR_STATUS
    this.isServerError = this.status >= DEFAULT_ERROR_STATUS
    this.retryable =
      typeof merged.retryable === 'boolean' ? merged.retryable : isRetryableStatus(this.status)
    this.appCode = merged.appCode
    this.route = merged.route
    this.operation = merged.operation
    this.requestId = merged.requestId
    this.correlationId = merged.correlationId
    this.details = cloneDetails(merged.details)
  }

  static from(error: unknown, overrides?: Partial<ActionFunctionErrorParams>): ActionsFunctionError {
    if (error instanceof ActionsFunctionError) {
      return new ActionsFunctionError(error.toParams(), overrides)
    }
    return new ActionsFunctionError(error, overrides)
  }

  toParams(): ActionFunctionErrorParams {
    return {
      message: this.message,
      stack: this.stack,
      cause: this.cause,
      status: this.status,
      appCode: this.appCode,
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
