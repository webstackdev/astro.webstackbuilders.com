const { DateTime } = require('luxon')

// Create a DateTime from a JavaScript Date object. Uses the default zone.
// DateTime.fromJSDate(date: Date, options: Object)

/**
 * Formats a date, defaults to May 16, 2017
 *
 * Usage:
 *   {{ build.timestamp | dateToFormat('yyyy') }}
 *
 * @param _
 * @param date
 * @param format
 */
exports.dateToFormat = (_, date, format = "LLL dd', 'yyyy") => {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat(String(format))
}

/**
 * Returns an ISO 8601-compliant string representation of this DateTime
 *
 * EXAMPLE: Friday, July 15, 2022 at 11:39:50 PM GMT+3
 *
 * Usage:
 *   <time dateTime="{{ post.date | dateToISO }}">{ post.date | readableDate }</time>
 *
 * @param _
 * @param date
 */
exports.dateToISO = (_, date) => {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toISO({
    includeOffset: false,
    suppressMilliseconds: true,
  })
}

/**
 * Create a DateTime from an ISO 8601 string
 *
 * Usage:
 *   {{ webmention.published | dateFromISO | readableDate("dd LLL yyyy") }}
 *
 * @param _
 * @param timestamp
 */
exports.dateFromISO = (_, timestamp) => {
  return DateTime.fromISO(timestamp, { zone: 'utc' }).toJSDate()
}


/**
 * Friendly date filter. Supported tokens:
 * https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens
 * Usage:
 *   {{ date | readableDate }}
 *   {{ webmention.published | dateFromISO | readableDate }}
 *
 * @param _
 * @param date
 * @param format
 */
exports.readableDate = (_, date, format = "LLLL d', 'yyyy") => {
  const datetimeObj = DateTime.fromJSDate(date, { zone: 'utc' })
  return datetimeObj.toFormat(format)
}

/**
 * Generate an ISO 8601 Extended timedate stamp for use in the build metadata script
 */
exports.getCurrentDateTime = () => {
  return dateToISO(new Date())
}
