export type SocialCardGenerationStage =
  | 'resolve-avatar'
  | 'resolve-description-font'
  | 'resolve-title-font'
  | 'load-avatar'
  | 'load-fonts'
  | 'init-canvaskit'
  | 'create-surface'
  | 'render-card'
  | 'encode-image'

export class SocialCardGenerationError extends Error {
  readonly stage: SocialCardGenerationStage
  readonly details?: Record<string, unknown>

  constructor(
    stage: SocialCardGenerationStage,
    message: string,
    details?: Record<string, unknown>,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'SocialCardGenerationError'
    this.stage = stage
    if (details !== undefined) {
      this.details = details
    }
  }
}

export const getSocialCardErrorDetails = (error: unknown): Record<string, unknown> => {
  if (!(error instanceof SocialCardGenerationError)) {
    return {}
  }

  const details = pruneUndefined(error.details)

  return {
    socialCardStage: error.stage,
    socialCardMessage: error.message,
    ...(details ? { socialCardDetails: details } : {}),
    ...(error.cause instanceof Error ? { socialCardCause: error.cause.message } : {}),
  }
}

const pruneUndefined = (
  details: Record<string, unknown> | undefined
): Record<string, unknown> | undefined => {
  if (!details) {
    return undefined
  }

  const entries = Object.entries(details).filter(([, value]) => value !== undefined)
  if (entries.length === 0) {
    return undefined
  }

  return Object.fromEntries(entries)
}