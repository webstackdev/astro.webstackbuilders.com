/**
 * Script for the Footer component
 */
import { getHireMeAnchorElement } from '@components/Footer/selectors'
import { handleScriptError, addScriptBreadcrumb } from '@components/scripts/errors'

class Footer {
  static scriptName = 'Footer'

  private static getMonthName(date: Date): string {
    const monthDate = new Date(date)
    monthDate.setMonth(monthDate.getMonth() - 1)
    return monthDate.toLocaleString('en-US', { month: 'long' })
  }

  static init(): void {
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

  static pause(): void {
    // No pause functionality needed for Footer
  }

  static resume(): void {
    // No resume functionality needed for Footer
  }

  static reset(): void {
    // No reset functionality needed for Footer
  }
}

export { Footer }
