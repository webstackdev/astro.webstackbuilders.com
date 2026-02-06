/**
 * Vitest setup file for test environment configuration
 * This file runs before all test files
 */
import { expect } from 'vitest'
import { toHaveInProtoChain, toBeNil, toBeObject } from '@test/unit/matchers/assertions'

// Configure happy-dom to silence JavaScript loading warnings
// This prevents "Failed to load module" errors when testing Astro components with <script> tags
interface HappyDOMWindow extends Window {
  happyDOM?: {
    settings: {
      disableJavaScriptFileLoading: boolean
      handleDisabledFileLoadingAsSuccess: boolean
    }
  }
}

if (typeof window !== 'undefined' && (window as HappyDOMWindow).happyDOM) {
  const happyWindow = window as HappyDOMWindow
  happyWindow.happyDOM!.settings.disableJavaScriptFileLoading = true
  happyWindow.happyDOM!.settings.handleDisabledFileLoadingAsSuccess = true
}

const suppressedConsoleMessagePatterns = [
  /Failed to load source map/i,
  /Sourcemap.*missing/i,
  /KaTeX.*quirks mode/i,
  /Lit is in dev mode/i,
  /\[AvatarManager\] Initialized with \d+ avatars/i,
  /Highlighter server render:/i,
  /Could not detect platform for URL:/i,
  /\[astro-icon\] Loaded icons/i,
  /DOMException \[AbortError\]: The operation was aborted\./i,
  /Failed to execute "fetch\(\)" on "Window" with URL "https:\/\/www\.youtube\.com\/embed\//i,
  /"route":"actions:/i,
  /"route":"\/api\//i,
  /🍪 Showing modal for first time/i,
  /🍪 User already consented, skipping modal/i,
  /🍪 Modal dismissed by user/i,
  /🍪 User accepted all cookies/i,
  /\[DEV\/TEST MODE\] Newsletter subscription would be created:/i,
  /ConvertKit API authentication failed:/i,
  /\[Newsletter Email\] Failed to send confirmation:/i,
]

const stripAnsi = (text: string): string => {
  return text.replace(/\u001B\[[0-9;]*m/g, '')
}

const isConsoleNoiseSuppressionEnabled = (): boolean => {
  return process.env['VITEST_SHOW_LOGS'] !== '1'
}

const shouldSuppressConsoleMessage = (args: unknown[]): boolean => {
  if (!isConsoleNoiseSuppressionEnabled()) return false

  const text = stripAnsi(
    args
    .map((arg) => {
      if (typeof arg === 'string') return arg
      try {
        return JSON.stringify(arg)
      } catch {
        return String(arg)
      }
    })
    .join(' ')
  )

  return suppressedConsoleMessagePatterns.some((pattern) => pattern.test(text))
}

const shouldSuppressTextMessage = (text: string): boolean => {
  if (!isConsoleNoiseSuppressionEnabled()) return false
  const plainText = stripAnsi(text)
  return suppressedConsoleMessagePatterns.some((pattern) => pattern.test(plainText))
}

const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  if (shouldSuppressConsoleMessage(args)) return
  originalWarn(...args)
}

const originalError = console.error
console.error = (...args: unknown[]) => {
  if (shouldSuppressConsoleMessage(args)) return
  originalError(...args)
}

const originalLog = console.log
console.log = (...args: unknown[]) => {
  if (shouldSuppressConsoleMessage(args)) return
  originalLog(...args)
}

const originalInfo = console.info
console.info = (...args: unknown[]) => {
  if (shouldSuppressConsoleMessage(args)) return
  originalInfo(...args)
}

const originalDebug = console.debug
console.debug = (...args: unknown[]) => {
  if (shouldSuppressConsoleMessage(args)) return
  originalDebug(...args)
}

const wrapStreamWrite = (stream: NodeJS.WriteStream): void => {
  const originalWrite = stream.write.bind(stream)

  let pendingText = ''
  let isSuppressingHappyDomYouTubeStack = false
  let isSuppressingHappyDomAbortStack = false

  const isHappyDomYouTubeNoiseStart = (line: string): boolean => {
    const plainLine = stripAnsi(line)
    return (
      /^.*youtube\.com\/embed\//i.test(plainLine) &&
      (/Failed to execute "fetch\(\)" on "Window"/i.test(plainLine) ||
        /DOMException \[(AbortError|NetworkError)\]/i.test(plainLine))
    )
  }

  const isHappyDomStackLine = (line: string): boolean => {
    const plainLine = stripAnsi(line)
    return /^\s+at\s+/i.test(plainLine) || /node_modules\/happy-dom\//i.test(plainLine)
  }

  const isHappyDomAbortNoiseStart = (line: string): boolean => {
    const plainLine = stripAnsi(line)
    return (
      /DOMException \[AbortError\]: The operation was aborted\./i.test(plainLine) ||
      /Fetch\.onAsyncTaskManagerAbort/i.test(plainLine)
    )
  }

  stream.write = ((
    chunk: unknown,
    encoding?: BufferEncoding,
    callback?: (error?: Error | null) => void
  ) => {
    if (!isConsoleNoiseSuppressionEnabled()) {
      return originalWrite(chunk as never, encoding as never, callback as never)
    }

    const text =
      typeof chunk === 'string'
        ? chunk
        : Buffer.isBuffer(chunk)
          ? chunk.toString(encoding)
          : String(chunk)

    pendingText += text
    const lines = pendingText.split('\n')
    pendingText = lines.pop() ?? ''

    const allowedLines: string[] = []

    for (const line of lines) {
      if (shouldSuppressTextMessage(line)) {
        continue
      }

      if (isSuppressingHappyDomAbortStack) {
        if (line.trim() === '') {
          isSuppressingHappyDomAbortStack = false
          continue
        }

        if (isHappyDomStackLine(line) || isHappyDomAbortNoiseStart(line)) {
          continue
        }

        isSuppressingHappyDomAbortStack = false
      }

      if (isSuppressingHappyDomYouTubeStack) {
        if (line.trim() === '') {
          isSuppressingHappyDomYouTubeStack = false
          continue
        }

        if (isHappyDomStackLine(line)) {
          continue
        }

        isSuppressingHappyDomYouTubeStack = false
      }

      if (isHappyDomYouTubeNoiseStart(line)) {
        isSuppressingHappyDomYouTubeStack = true
        continue
      }

      if (isHappyDomAbortNoiseStart(line)) {
        isSuppressingHappyDomAbortStack = true
        continue
      }

      allowedLines.push(`${line}\n`)
    }

    if (allowedLines.length > 0) {
      const combinedText = allowedLines.join('')
      originalWrite(combinedText as never, encoding as never)
    }

    if (typeof callback === 'function') callback()
    return true
  }) as typeof stream.write
}

if (typeof process !== 'undefined') {
  wrapStreamWrite(process.stdout)
  wrapStreamWrite(process.stderr)
}

// Fix esbuild TextEncoder issue for Astro Container API
// See: https://github.com/withastro/astro/issues/8755
Object.defineProperty(globalThis, 'TextEncoder', {
  value: TextEncoder,
  writable: true,
})

Object.defineProperty(globalThis, 'TextDecoder', {
  value: TextDecoder,
  writable: true,
})

// Try to load axe matchers if available
try {
  // Use dynamic import to avoid TypeScript/linting issues
  import('vitest-axe/matchers').then((axeMatchers) => {
    expect.extend(axeMatchers)
  }).catch(() => {
    // Axe matchers not available, continue without them
  })
} catch {
  // Axe matchers not available, continue without them
}

// Extend vitest's expect with custom matchers
expect.extend({
  toHaveInProtoChain,
  toBeNil,
  toBeObject
})
