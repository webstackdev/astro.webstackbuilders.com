import { ClientScriptError } from '@components/scripts/errors'

export const getCalendarTriggerButton = (root: HTMLElement): HTMLButtonElement => {
  const trigger = root.querySelector('[data-calendar-trigger]')
  if (!(trigger instanceof HTMLButtonElement)) {
    throw new ClientScriptError('Calendar: trigger button not found')
  }

  return trigger
}

export const getCalendarMenuElement = (root: HTMLElement): HTMLElement => {
  const menu = root.querySelector('[data-calendar-menu]')
  if (!(menu instanceof HTMLElement)) {
    throw new ClientScriptError('Calendar: menu element not found')
  }

  return menu
}

export const getCalendarLinkElement = (
  root: HTMLElement,
  calendarType: 'google' | 'outlook'
): HTMLAnchorElement => {
  const link = root.querySelector(`[data-calendar-link="${calendarType}"]`)
  if (!(link instanceof HTMLAnchorElement)) {
    throw new ClientScriptError(`Calendar: link not found: ${calendarType}`)
  }

  return link
}

export const getCalendarDownloadIcsButton = (root: HTMLElement): HTMLButtonElement => {
  const button = root.querySelector('[data-calendar-download-ics]')
  if (!(button instanceof HTMLButtonElement)) {
    throw new ClientScriptError('Calendar: download .ics button not found')
  }

  return button
}
