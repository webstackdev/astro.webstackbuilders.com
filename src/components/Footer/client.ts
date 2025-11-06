/**
 * Script for the Footer component using LoadableScript pattern
 */
import { LoadableScript, type TriggerEvent } from '@components/scripts/loader/@types'
import { getHireMeAnchorElement } from '@components/Footer/selectors'
import { handleScriptError, addScriptBreadcrumb } from '@components/scripts/errors'

class Footer extends LoadableScript {
  static override scriptName = 'Footer'
  static override eventType: TriggerEvent = 'astro:page-load'

  private static getMonthName(date: Date): string {
    const monthDate = new Date(date)
    monthDate.setMonth(monthDate.getMonth() - 1)
    return monthDate.toLocaleString('en-US', { month: 'long' })
  }

  static override init(): void {
    const context = { scriptName: Footer.scriptName, operation: 'init' }
    addScriptBreadcrumb(context)

    try {
      const anchor = getHireMeAnchorElement()
      const date = new Date()
      const month = Footer.getMonthName(date)
      const year = date.getFullYear()
      anchor.innerHTML = `Available ${month}, ${year}. Hire Me Now`
      anchor.style.display = 'inline-block'
    } catch (error) {
      // Footer date is optional enhancement
      handleScriptError(error, context)
    }
  }

  static override pause(): void {
    // No pause functionality needed for Footer
  }

  static override resume(): void {
    // No resume functionality needed for Footer
  }

  static override reset(): void {
    // No reset functionality needed for Footer
  }
}

export { Footer }
