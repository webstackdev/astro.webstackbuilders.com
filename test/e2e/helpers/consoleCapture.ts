/**
 * Console Capture Helper for E2E Tests
 *
 * Captures all console output from the browser during tests,
 * including nested group content and arguments.
 *
 * Useful for debugging View Transitions and other browser events.
 */

import type { Page, ConsoleMessage } from '@playwright/test'

export interface CapturedConsoleMessage {
  type: string
  text: string
  args: string[]
  location?: string
}

/**
 * Sets up console message capture on a Playwright page
 *
 * @param page - The Playwright page to capture console from
 * @param enableLogging - Whether to print messages to test output in real-time
 * @returns Array that will be populated with captured messages
 *
 * @example
 * ```ts
 * const messages = setupConsoleCapture(page, true)
 * // ... perform actions ...
 * printCapturedMessages(messages)
 * ```
 */
export function setupConsoleCapture(
  page: Page,
  enableLogging = false
): CapturedConsoleMessage[] {
  const messages: CapturedConsoleMessage[] = []

  page.on('console', async (msg: ConsoleMessage) => {
    const type = msg.type()
    const text = msg.text()

    // Get all arguments (for grouped messages)
    const args: string[] = []
    for (const arg of msg.args()) {
      try {
        const value = await arg.jsonValue().catch(() => arg.toString())
        args.push(String(value))
      } catch {
        args.push(arg.toString())
      }
    }

    messages.push({
      type,
      text,
      args,
      location: msg.location().url,
    })

    // Print to test output for real-time debugging
    if (enableLogging) {
      console.log(`[${type}] ${text}`)
      if (args.length > 0 && args.join('') !== text) {
        console.log(`  Args: ${args.join(', ')}`)
      }
    }
  })

  return messages
}

/**
 * Prints all captured console messages to test output
 *
 * @param messages - Array of captured console messages
 * @param title - Optional title for the output section
 *
 * @example
 * ```ts
 * printCapturedMessages(messages, 'Navigation Console Output')
 * ```
 */
export function printCapturedMessages(
  messages: CapturedConsoleMessage[],
  title = 'Console Messages'
): void {
  console.log(`\n=== ${title} ===`)
  messages.forEach((msg, i) => {
    console.log(`\n[${i}] ${msg.type}: ${msg.text}`)
    if (msg.args.length > 1) {
      console.log(`    Full args (${msg.args.length}):`, msg.args.slice(0, 5))
    }
  })
  console.log(`=== END ${title.toUpperCase()} ===\n`)
}
