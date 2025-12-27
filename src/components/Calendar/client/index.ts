import { LitElement } from 'lit'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

import {
  getCalendarDownloadIcsButton,
  getCalendarLinkElement,
  getCalendarMenuElement,
  getCalendarTriggerButton,
} from './selectors'

type CalendarEventData = {
  name: string
  startDate: string
  startTime?: string
  endDate?: string
  endTime?: string
  description?: string
  location?: string
}

const pad2 = (value: number): string => `${value}`.padStart(2, '0')

const formatUtcDateTimeForCalendar = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = pad2(date.getUTCMonth() + 1)
  const day = pad2(date.getUTCDate())
  const hours = pad2(date.getUTCHours())
  const minutes = pad2(date.getUTCMinutes())
  const seconds = pad2(date.getUTCSeconds())

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

const formatUtcDateForCalendar = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = pad2(date.getUTCMonth() + 1)
  const day = pad2(date.getUTCDate())

  return `${year}${month}${day}`
}

const parseIsoUtcDate = (date: string, time?: string): Date => {
  if (!time) {
    return new Date(`${date}T00:00:00Z`)
  }

  return new Date(`${date}T${time}:00Z`)
}

const escapeIcsText = (value: string): string => {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

const buildGoogleCalendarUrl = (eventData: CalendarEventData): string => {
  const start = parseIsoUtcDate(eventData.startDate, eventData.startTime)

  const end = ((): Date => {
    if (eventData.endDate || eventData.endTime) {
      return parseIsoUtcDate(
        eventData.endDate ?? eventData.startDate,
        eventData.endTime ?? eventData.startTime
      )
    }

    if (eventData.startTime) {
      return new Date(start.getTime() + 60 * 60 * 1000)
    }

    return new Date(start.getTime() + 24 * 60 * 60 * 1000)
  })()

  const dates = eventData.startTime
    ? `${formatUtcDateTimeForCalendar(start)}/${formatUtcDateTimeForCalendar(end)}`
    : `${formatUtcDateForCalendar(start)}/${formatUtcDateForCalendar(end)}`

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventData.name,
    dates,
  })

  if (eventData.description) {
    params.set('details', eventData.description)
  }

  if (eventData.location) {
    params.set('location', eventData.location)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const buildOutlookCalendarUrl = (eventData: CalendarEventData): string => {
  const start = parseIsoUtcDate(eventData.startDate, eventData.startTime)
  const end = ((): Date => {
    if (eventData.endDate || eventData.endTime) {
      return parseIsoUtcDate(
        eventData.endDate ?? eventData.startDate,
        eventData.endTime ?? eventData.startTime
      )
    }

    if (eventData.startTime) {
      return new Date(start.getTime() + 60 * 60 * 1000)
    }

    return new Date(start.getTime() + 24 * 60 * 60 * 1000)
  })()

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: eventData.name,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  })

  if (eventData.description) {
    params.set('body', eventData.description)
  }

  if (eventData.location) {
    params.set('location', eventData.location)
  }

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`
}

const buildIcsText = (eventData: CalendarEventData): string => {
  const now = new Date()
  const dtStamp = formatUtcDateTimeForCalendar(now)
  const uid = `${now.getTime()}-${Math.random().toString(16).slice(2)}`

  const start = parseIsoUtcDate(eventData.startDate, eventData.startTime)
  const end = ((): Date => {
    if (eventData.endDate || eventData.endTime) {
      return parseIsoUtcDate(
        eventData.endDate ?? eventData.startDate,
        eventData.endTime ?? eventData.startTime
      )
    }

    if (eventData.startTime) {
      return new Date(start.getTime() + 60 * 60 * 1000)
    }

    return new Date(start.getTime() + 24 * 60 * 60 * 1000)
  })()

  const lines: string[] = []
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('PRODID:-//WebstackBuilders//AddToCalendar//EN')
  lines.push('METHOD:PUBLISH')
  lines.push('BEGIN:VEVENT')
  lines.push(`UID:${uid}`)
  lines.push(`DTSTAMP:${dtStamp}`)

  if (eventData.startTime) {
    lines.push(`DTSTART:${formatUtcDateTimeForCalendar(start)}`)
    lines.push(`DTEND:${formatUtcDateTimeForCalendar(end)}`)
  } else {
    lines.push(`DTSTART;VALUE=DATE:${formatUtcDateForCalendar(start)}`)
    lines.push(`DTEND;VALUE=DATE:${formatUtcDateForCalendar(end)}`)
  }

  lines.push(`SUMMARY:${escapeIcsText(eventData.name)}`)

  if (eventData.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(eventData.description)}`)
  }

  if (eventData.location) {
    lines.push(`LOCATION:${escapeIcsText(eventData.location)}`)
  }

  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

const downloadIcsFile = (icsText: string, filenameBase: string): void => {
  try {
    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${filenameBase}.ics`
    anchor.rel = 'noopener'
    anchor.click()

    URL.revokeObjectURL(url)
  } catch (error) {
    console.error(error)
  }
}

export class AddToCalendarElement extends LitElement {
  static registeredName = 'add-to-calendar'

  static override properties = {
    open: { type: Boolean, reflect: true },
  }

  protected override createRenderRoot() {
    // Renders into the light DOM
    return this
  }

  declare open: boolean

  private listenersAttached = false

  constructor() {
    super()
    this.open = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.attachListeners()
    this.syncUi()
  }

  private attachListeners(): void {
    const context = { scriptName: 'AddToCalendarElement', operation: 'attachListeners' }
    addScriptBreadcrumb(context)

    try {
      if (this.listenersAttached) {
        return
      }

      const trigger = getCalendarTriggerButton(this)
      addButtonEventListeners(trigger, this.handleTriggerClick, this)

      const downloadButton = getCalendarDownloadIcsButton(this)
      addButtonEventListeners(downloadButton, this.handleDownloadIcsClick, this)

      this.listenersAttached = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private readEventData(): CalendarEventData {
    const name = (this.getAttribute('name') ?? '').trim()
    const startDate = (
      this.getAttribute('startDate') ??
      this.getAttribute('startdate') ??
      ''
    ).trim()
    const startTime = (
      this.getAttribute('startTime') ??
      this.getAttribute('starttime') ??
      ''
    ).trim()
    const endDate = (this.getAttribute('endDate') ?? this.getAttribute('enddate') ?? '').trim()
    const endTime = (this.getAttribute('endTime') ?? this.getAttribute('endtime') ?? '').trim()
    const description = (this.getAttribute('description') ?? '').trim()
    const location = (this.getAttribute('location') ?? '').trim()

    if (!name || !startDate) {
      throw new Error('Calendar: missing required attributes: name, startDate')
    }

    return {
      name,
      startDate,
      ...(startTime ? { startTime } : {}),
      ...(endDate ? { endDate } : {}),
      ...(endTime ? { endTime } : {}),
      ...(description ? { description } : {}),
      ...(location ? { location } : {}),
    }
  }

  private syncUi(): void {
    const context = { scriptName: 'AddToCalendarElement', operation: 'syncUi' }
    addScriptBreadcrumb(context)

    try {
      const trigger = getCalendarTriggerButton(this)
      const menu = getCalendarMenuElement(this)

      menu.classList.toggle('hidden', !this.open)
      trigger.setAttribute('aria-expanded', this.open ? 'true' : 'false')

      if (!this.open) {
        return
      }

      const eventData = this.readEventData()

      const googleLink = getCalendarLinkElement(this, 'google')
      googleLink.href = buildGoogleCalendarUrl(eventData)

      const outlookLink = getCalendarLinkElement(this, 'outlook')
      outlookLink.href = buildOutlookCalendarUrl(eventData)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private readonly handleTriggerClick = (_event: Event): void => {
    this.open = !this.open
    this.syncUi()
  }

  private readonly handleDownloadIcsClick = (_event: Event): void => {
    const context = { scriptName: 'AddToCalendarElement', operation: 'handleDownloadIcsClick' }
    addScriptBreadcrumb(context)

    try {
      const eventData = this.readEventData()
      const icsText = buildIcsText(eventData)
      downloadIcsFile(icsText, 'event')

      this.open = false
      this.syncUi()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  protected override updated(): void {
    this.syncUi()
  }

  protected override render() {
    return null
  }
}

export const registerWebComponent = async (tagName = AddToCalendarElement.registeredName) => {
  defineCustomElement(tagName, AddToCalendarElement)
}

export const registerAddToCalendarWebComponent = registerWebComponent

export const webComponentModule: WebComponentModule<AddToCalendarElement> = {
  registeredName: AddToCalendarElement.registeredName,
  componentCtor: AddToCalendarElement,
  registerWebComponent,
}
