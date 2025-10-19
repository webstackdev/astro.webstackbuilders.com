/**
 * Unit tests for pageTitle helper
 */
import { describe, expect, test } from 'vitest'
import { pageTitle } from '../pageTitle'

describe(`pageTitle helper`, () => {
  test(`returns formatted page title with separator`, () => {
    const result = pageTitle('About Us', 'My Site')
    expect(result).toBe('About Us | My Site')
  })

  test(`returns only site title when page title is empty`, () => {
    const result = pageTitle('', 'My Site')
    expect(result).toBe('My Site')
  })

  test(`applies title case to page title`, () => {
    const result = pageTitle('about us', 'My Site')
    expect(result).toBe('About Us | My Site')
  })

  test(`applies title case to site title`, () => {
    const result = pageTitle('About Us', 'my site')
    expect(result).toBe('About Us | My Site')
  })

  test(`applies title case to both titles`, () => {
    const result = pageTitle('contact page', 'web company')
    expect(result).toBe('Contact Page | Web Company')
  })

  test(`handles title with hyphens`, () => {
    const result = pageTitle('case-study', 'My Site')
    expect(result).toBe('Case-Study | My Site')
  })

  test(`handles title with multiple words`, () => {
    const result = pageTitle('Our Team Members', 'My Site')
    expect(result).toBe('Our Team Members | My Site')
  })

  test(`throws error when title is not a string`, () => {
    // @ts-expect-error Testing invalid input
    expect(() => pageTitle(123, 'My Site')).toThrow(
      'Title passed to pageTitle formatter is not a string'
    )
  })

  test(`throws error when title is null`, () => {
    // @ts-expect-error Testing invalid input
    expect(() => pageTitle(null, 'My Site')).toThrow(
      'Title passed to pageTitle formatter is not a string'
    )
  })

  test(`throws error when title is undefined`, () => {
    // @ts-expect-error Testing invalid input
    expect(() => pageTitle(undefined, 'My Site')).toThrow(
      'Title passed to pageTitle formatter is not a string'
    )
  })

  test(`handles special characters in title`, () => {
    const result = pageTitle('FAQ & Help', 'My Site')
    expect(result).toBe('FAQ & Help | My Site')
  })

  test(`preserves existing title case formatting`, () => {
    const result = pageTitle('iPhone App', 'My Site')
    expect(result).toBe('IPhone App | My Site')
  })
})
