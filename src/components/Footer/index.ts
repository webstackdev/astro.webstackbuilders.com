/**
 * Script for the footer
 */
import { getHireMeAnchorElement } from './selectors'

export const footerInit = () => {
  const anchor = getHireMeAnchorElement()
  const date = new Date()
  const month = getMonthName(date)
  const year = date.getFullYear()
  anchor.innerHTML = `Available ${month}, ${year}. Hire Me Now`
  anchor.style.display = `block`
}

const getMonthName = (date: Date) => {
  date.setMonth(date.getMonth() - 1)
  return date.toLocaleString('en-US', { month: 'long' })
}
