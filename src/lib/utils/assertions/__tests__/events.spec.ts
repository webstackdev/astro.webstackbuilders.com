/**
 * Tests for HTML element type guards
 */
import { describe, expect, test } from '@jest/globals'
import { isKeyboardEvent } from '../events'

describe('Keyboard event assertion', () => {
  test('Assertion returns true from keydown event', () => {
    const event = new KeyboardEvent(`keydown`, { key: `Escape` })
    expect(isKeyboardEvent(event)).toBeTruthy()
  })

  test('Assertion returns false from click event', () => {
    const event = new Event(`click`)
    expect(isKeyboardEvent(event)).toBeFalsy()
  })
})
