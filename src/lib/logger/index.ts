import colors from 'ansi-colors'
import fancyLog from 'fancy-log'

/**
 * Log a message or series of messages using chalk's blue color.
 *
 * @param message - Message(s) to write to the log.
 */
type logColor = `red` | `green` | `yellow` | `blue` | `magenta` | `cyan` | `white`

export const log = (message: string | string[], color: logColor = `magenta`) => {
  if (message instanceof Array) {
    message.forEach(item => {
      fancyLog(colors[color](item))
    })
  } else {
    fancyLog(colors[color](message))
  }
}

/**
 * Logs any errors that are passed in
 *
 * @param error   - Error object to log.
 */
log.error = (error: Error): void => {
  log(error.toString(), `red`)
}
