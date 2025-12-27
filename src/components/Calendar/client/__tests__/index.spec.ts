import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import CalendarFixture from '@components/Calendar/client/__fixtures__/calendar.fixture.astro'
import type { AddToCalendarElement } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type CalendarModule = WebComponentModule<AddToCalendarElement>

describe('AddToCalendarElement', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('toggles the menu visibility when the trigger is clicked', async () => {
    await executeRender<CalendarModule>({
      container,
      component: CalendarFixture,
      moduleSpecifier: '@components/Calendar/client/index',
      waitForReady: async element => {
        await element.updateComplete
      },
      assert: async ({ element, window, module, renderResult }) => {
        expect(renderResult).toContain(`<${module.registeredName}`)

        const trigger = element.querySelector('[data-calendar-trigger]')
        expect(trigger).toBeTruthy()
        expect(trigger).toBeInstanceOf(window!.HTMLButtonElement)

        const menu = element.querySelector('[data-calendar-menu]')
        expect(menu).toBeTruthy()
        expect(menu).toBeInstanceOf(window!.HTMLElement)
        expect((menu as HTMLElement).classList.contains('hidden')).toBe(true)

        trigger?.dispatchEvent(new window!.Event('click', { bubbles: true }))
        await element.updateComplete

        expect((menu as HTMLElement).classList.contains('hidden')).toBe(false)

        const googleLink = element.querySelector('[data-calendar-link="google"]')
        expect(googleLink).toBeTruthy()
        expect(googleLink).toBeInstanceOf(window!.HTMLAnchorElement)
        expect((googleLink as HTMLAnchorElement).href).toContain('calendar.google.com')

        const outlookLink = element.querySelector('[data-calendar-link="outlook"]')
        expect(outlookLink).toBeTruthy()
        expect(outlookLink).toBeInstanceOf(window!.HTMLAnchorElement)
        expect((outlookLink as HTMLAnchorElement).href).toContain('outlook.office.com')

        trigger?.dispatchEvent(new window!.Event('click', { bubbles: true }))
        await element.updateComplete

        expect((menu as HTMLElement).classList.contains('hidden')).toBe(true)
      },
    })
  })
})
