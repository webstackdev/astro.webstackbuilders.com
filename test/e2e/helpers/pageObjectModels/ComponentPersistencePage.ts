/**
 * Component Persistence Page Object Model
 *
 * Specialized page object for testing Astro View Transitions persistence
 * with web components and framework components.
 */

import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'
import type { CapturedConsoleMessage } from '@test/e2e/helpers/consoleCapture'
import type { ElementWithTestProperties } from '@test/e2e/assertions'

export interface PersistenceTestData {
  uniqueId: string
  initialTimestamp: number
  tagName: string
}

export interface PersistenceVerificationData {
  dataAttribute: string | null
  customProperty: string | null
  navigationCounter: number
  elementExists: boolean
  tagName: string
}

export class ComponentPersistencePage extends BasePage {
  private consoleMessages: CapturedConsoleMessage[] = []

  protected constructor(page: Page) {
    super(page)
  }

  static override async init(page: Page): Promise<ComponentPersistencePage> {
    await page.addInitScript(() => {
      window.isPlaywrightControlled = true
    })
    const instance = new ComponentPersistencePage(page)
    await instance.onInit()
    return instance
  }

  /**
   * Custom initialization - sets up console message capture
   */
  protected override async onInit(): Promise<void> {
    await super.onInit()
    this.setupConsoleCapture()
  }

  /**
   * Set up console message capture
   */
  private setupConsoleCapture(): void {
    this.page.on('console', async msg => {
      const type = msg.type()
      const text = msg.text()

      const args: string[] = []
      for (const arg of msg.args()) {
        try {
          const value = await arg.jsonValue().catch(() => arg.toString())
          args.push(String(value))
        } catch {
          args.push(arg.toString())
        }
      }

      this.consoleMessages.push({
        type,
        text,
        args,
        location: msg.location().url,
      })

      // Only print errors and warnings for real-time debugging
      if (type === 'error' || type === 'warning') {
        console.log(`[${type}] ${text}`)
        if (args.length > 0 && args.join('') !== text) {
          console.log(`  Args: ${args.join(', ')}`)
        }
      }
    })
  }

  /**
   * Print all captured console messages
   */
  printCapturedMessages(title = 'Console Messages'): void {
    console.log(`\n=== ${title} ===`)
    this.consoleMessages.forEach((msg, i) => {
      console.log(`\n[${i}] ${msg.type}: ${msg.text}`)
      if (msg.args.length > 1) {
        console.log(`    Full args (${msg.args.length}):`, msg.args.slice(0, 5))
      }
    })
    console.log(`=== END ${title.toUpperCase()} ===\n`)
  }

  /**
   * Set up persistence test data on an element
   *
   * @param selector - CSS selector for the element to test
   * @returns Initial test data with unique ID and timestamp
   */
  async setupPersistenceTest(selector: string): Promise<PersistenceTestData> {
    return await this.evaluate((sel: string) => {
      const element = document.querySelector(sel) as ElementWithTestProperties | null
      if (!element) throw new Error(`${sel} element not found`)

      // Create a unique identifier
      const uniqueId = `test-${Date.now()}-${Math.random()}`

      // Set it as a data attribute
      element.setAttribute('data-unique-id', uniqueId)

      // Also set a custom property directly on the DOM element
      element.__testProperty = uniqueId

      // Store a counter to verify the element isn't recreated
      element.__navigationCounter = 0

      return {
        uniqueId,
        initialTimestamp: Date.now(),
        tagName: element.tagName.toLowerCase(),
      }
    }, selector)
  }

  /**
   * Verify element persistence after navigation
   *
   * @param selector - CSS selector for the element to verify
   * @returns Verification data showing if element persisted
   */
  async verifyPersistence(selector: string): Promise<PersistenceVerificationData> {
    return await this.evaluate((sel: string) => {
      const element = document.querySelector(sel) as ElementWithTestProperties | null
      if (!element) throw new Error(`${sel} element not found after navigation`)

      // Increment counter to prove it's the same element
      const counter = element.__navigationCounter ?? 0
      element.__navigationCounter = counter + 1

      return {
        dataAttribute: element.getAttribute('data-unique-id'),
        customProperty: element.__testProperty ?? null,
        navigationCounter: counter,
        elementExists: !!element,
        tagName: element.tagName.toLowerCase(),
      }
    }, selector)
  }

  /**
   * Assert that element persisted across navigation
   *
   * @param initialData - Initial test data from setupPersistenceTest
   * @param verificationData - Verification data from verifyPersistence
   */
  assertPersistence(
    initialData: PersistenceTestData,
    verificationData: PersistenceVerificationData
  ): void {
    expect(verificationData.elementExists).toBe(true)
    expect(verificationData.tagName).toBe(initialData.tagName)
    expect(verificationData.dataAttribute).toBe(initialData.uniqueId)
    expect(verificationData.customProperty).toBe(initialData.uniqueId)
    expect(verificationData.navigationCounter).toBe(0) // Should still be 0 if element persisted
  }
}
