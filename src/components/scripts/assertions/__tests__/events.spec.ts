// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { isKeyboardEvent } from '../events'

describe('event assertions', () => {
  it('accepts keyboard events', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    expect(isKeyboardEvent(event)).toBe(true)
  })

  it('rejects non-keyboard events', () => {
    const mouseEvent = new MouseEvent('click')
    expect(isKeyboardEvent(mouseEvent)).toBe(false)
  })
})
