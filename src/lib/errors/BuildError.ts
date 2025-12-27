/**
 * Custom error class for build-time errors with enhanced context
 *
 * Used for errors that occur during build processes, Astro integrations,
 * compilation, file operations, and other build-time activities.
 */

export interface BuildErrorParams {
  message: string
  stack?: string | undefined
  cause?: unknown
  /** Build phase where the error occurred (e.g., 'compilation', 'optimization', 'bundling') */
  phase?: string | undefined
  /** File path where the error occurred */
  filePath?: string | undefined
  /** Build tool or process that encountered the error */
  tool?: string | undefined
  /** Line number in source file (for compilation errors) */
  lineNumber?: number | undefined
  /** Column number in source file (for compilation errors) */
  columnNumber?: number | undefined
  /** Exit code from build process */
  exitCode?: number | undefined
}

/**
 * Normalize various input types to BuildErrorParams
 */
function normalizeMessage(message: unknown): BuildErrorParams {
  if (message instanceof Error) {
    return {
      message: message.message,
      stack: message.stack,
      cause: message.cause,
    }
  }

  if (typeof message === 'string') {
    return { message }
  }

  if (message === undefined || message === null) {
    return { message: '' }
  }

  return { message: String(message) }
}

export class BuildError extends Error {
  phase?: string | undefined
  filePath?: string | undefined
  tool?: string | undefined
  lineNumber?: number | undefined
  columnNumber?: number | undefined
  exitCode?: number | undefined

  constructor(message?: unknown, context?: Partial<BuildErrorParams>) {
    const data = normalizeMessage(message)
    super(data.message || '')

    /**
     * Set error name as constructor name and make it not enumerable to
     * keep native Error behavior
     */
    Object.defineProperty(this, 'name', {
      value: 'BuildError',
      enumerable: false,
      configurable: true,
    })

    /** Fix the extended error prototype chain because TypeScript __extends can't */
    Object.setPrototypeOf(this, new.target.prototype)

    /** Remove constructor from stack trace in V8 */
    if ('captureStackTrace' in Error) Error.captureStackTrace(this, BuildError)

    /** V8 collects last 10 stack traces by default, this collects all */
    if ('stackTraceLimit' in Error) Error.stackTraceLimit = Infinity

    // Set core error properties
    this.message = data.message || ''
    this.cause = data.cause

    // Set build-specific context from constructor parameter
    if (context) {
      this.phase = context.phase
      this.tool = context.tool
      this.exitCode = context.exitCode
      this.filePath = context.filePath
      this.lineNumber = context.lineNumber
      this.columnNumber = context.columnNumber
    }
  }

  /**
   * Create a BuildError for compilation failures
   */
  static compilation(
    message: string,
    filePath?: string,
    lineNumber?: number,
    columnNumber?: number
  ): BuildError {
    return new BuildError(message, {
      phase: 'compilation',
      tool: 'typescript',
      filePath,
      lineNumber,
      columnNumber,
    })
  }

  /**
   * Create a BuildError for file operation failures
   */
  static fileOperation(message: string, filePath?: string, operation?: string): BuildError {
    return new BuildError(message, {
      phase: 'file-operation',
      tool: operation || 'filesystem',
      filePath,
    })
  }

  /**
   * Create a BuildError for bundling/build tool failures
   */
  static bundling(message: string, tool?: string, exitCode?: number): BuildError {
    return new BuildError(message, {
      phase: 'bundling',
      tool: tool || 'bundler',
      exitCode,
    })
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        stack: this.stack,
        phase: this.phase,
        filePath: this.filePath,
        tool: this.tool,
        lineNumber: this.lineNumber,
        columnNumber: this.columnNumber,
        exitCode: this.exitCode,
      },
    }
  }

  /**
   * Format error for console output with build context
   */
  override toString(): string {
    let output = `${this.name}: ${this.message}`

    if (this.phase) output += ` [${this.phase}]`
    if (this.tool) output += ` (${this.tool})`
    if (this.filePath) {
      output += `\n  at ${this.filePath}`
      if (this.lineNumber) {
        output += `:${this.lineNumber}`
        if (this.columnNumber) output += `:${this.columnNumber}`
      }
    }
    if (this.exitCode !== undefined) output += `\n  Exit code: ${this.exitCode}`

    return output
  }
}

/**
 * Type guard to check if an error is a BuildError
 */
export function isBuildError(error: unknown): error is BuildError {
  return error instanceof BuildError
}
