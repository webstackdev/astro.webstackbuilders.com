export interface ClientActionError {
  code?: string
  message?: string
  status?: number
}

const getErrorRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (typeof value !== 'object' || value === null) {
    return undefined
  }

  return value as Record<string, unknown>
}

const parseStatusCode = (value: unknown): number | undefined => {
  const statusCode = typeof value === 'number' ? value : Number(value)

  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    return undefined
  }

  return statusCode
}

const parseStatusCodeFromMessage = (message?: string): number | undefined => {
  const match = message?.match(/status code:\s*(\d{3})/i)

  if (!match?.[1]) {
    return undefined
  }

  return parseStatusCode(match[1])
}

const createClientActionError = (params: {
  code?: string | undefined
  message?: string | undefined
  status?: number | undefined
}): ClientActionError => {
  const actionError: ClientActionError = {}

  if (params.code !== undefined) actionError.code = params.code
  if (params.message !== undefined) actionError.message = params.message
  if (params.status !== undefined) actionError.status = params.status

  return actionError
}

export const normalizeClientActionError = (value: unknown): ClientActionError | undefined => {
  if (!value) {
    return undefined
  }

  if (typeof value === 'string') {
    return createClientActionError({
      message: value,
      status: parseStatusCodeFromMessage(value),
    })
  }

  if (value instanceof Error) {
    const errorRecord = getErrorRecord(value.cause)

    return createClientActionError({
      code: typeof errorRecord?.['code'] === 'string' ? errorRecord['code'] : undefined,
      message: value.message,
      status:
        parseStatusCode(errorRecord?.['status']) ??
        parseStatusCode(errorRecord?.['statusCode']) ??
        parseStatusCodeFromMessage(value.message),
    })
  }

  const errorRecord = getErrorRecord(value)
  if (!errorRecord) {
    return createClientActionError({
      message: String(value),
    })
  }

  const causeRecord = getErrorRecord(errorRecord['cause'])
  const message =
    typeof errorRecord['message'] === 'string'
      ? errorRecord['message']
      : typeof causeRecord?.['message'] === 'string'
        ? causeRecord['message']
        : undefined

  return createClientActionError({
    code:
      typeof errorRecord['code'] === 'string'
        ? errorRecord['code']
        : typeof causeRecord?.['code'] === 'string'
          ? causeRecord['code']
          : undefined,
    message,
    status:
      parseStatusCode(errorRecord['status']) ??
      parseStatusCode(errorRecord['statusCode']) ??
      parseStatusCode(causeRecord?.['status']) ??
      parseStatusCode(causeRecord?.['statusCode']) ??
      parseStatusCodeFromMessage(message),
  })
}

export const isForbiddenClientActionError = (error?: ClientActionError): boolean => {
  return error?.code === 'FORBIDDEN' || error?.status === 403
}
