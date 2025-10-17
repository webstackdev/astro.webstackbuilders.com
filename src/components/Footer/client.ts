/**
 * Script for the Footer component using LoadableScript pattern
 */
import { LoadableScript, type TriggerEvent } from '../Scripts/loader/@types/loader'
import { getHireMeAnchorElement } from './selectors'

class Footer extends LoadableScript {
  static override scriptName = 'Footer'
  static override eventType: TriggerEvent = 'astro:page-load'

  private static getMonthName(date: Date): string {
    const monthDate = new Date(date)
    monthDate.setMonth(monthDate.getMonth() - 1)
    return monthDate.toLocaleString('en-US', { month: 'long' })
  }

  static override init(): void {
    const anchor = getHireMeAnchorElement()
    const date = new Date()
    const month = Footer.getMonthName(date)
    const year = date.getFullYear()
    anchor.innerHTML = `Available ${month}, ${year}. Hire Me Now`
    anchor.style.display = 'inline-block'
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
