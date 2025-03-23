/**
 * Unit and integration test for format date filter.
 */
const { describe, expect, test } = require('@jest/globals')
const { dateToFormat, dateToISO, dateFromISO, readableDate } = require('../date')

describe(`format date filter tests`, () => {
  const TestDate = new Date(`2021-03-31`)

  test(`date to format filter hits happy path`, () => {
    expect(dateToFormat(undefined, TestDate)).toMatch(/Mar 31, 2021/)
  })

  test(`date to format filter implements format parameter`, () => {
    expect(dateToFormat(undefined, TestDate, 'yyyy')).toMatch(/2021/)
  })

  test(`date to ISO filter hits happy path`, () => {
    expect(dateToISO(undefined, TestDate)).toMatch(/2021-03-31T00:00:00/)
  })

  test(`date from ISO filter hits happy path`, () => {
    expect(dateFromISO(undefined, `2022-07-19T01:24:17.381`).toString()).toMatch(
      /Tue Jul 19 2022 04:24:17 GMT\+0300 \(Moscow Standard Time\)/
    )
  })

  test(`readable date filter hits happy path`, () => {
    expect(readableDate(undefined, TestDate).toString()).toMatch(/March 31, 2021/)
  })
})
