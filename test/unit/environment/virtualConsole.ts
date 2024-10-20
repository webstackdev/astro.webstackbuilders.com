/**
 * Virtual console provided to JSDOM constructor
 */
import { VirtualConsole } from 'jsdom'

/*
 @TODO: should also be able to configure this maybe with widening the globalThis.JSDOM_QUIET_MODE property so that you can capture the virtual console output in a test to assert against error or other console output.

virtualConsole.on('error', () => { ... })
virtualConsole.on('warn', () => { ... })
virtualConsole.on('info', () => { ... })
virtualConsole.on('dir', () => { ... })

'jsdom' event fires on the following:

- Errors loading or parsing subresources (scripts, stylesheets, frames, and iframes)
- Script execution errors that are not handled by a window 'onerror' event handler that returns 'true' or calls 'event.preventDefault()'
- Not-implemented errors resulting from calls to methods, like 'window.alert', which JSDOM does not implement but installs anyway for web compatibility
*/

export const getVirtualConsole = (console: Console) => {
  const virtualConsole = new VirtualConsole()
  virtualConsole.sendTo(console, { omitJSDOMErrors: true })
  virtualConsole.on('jsdomError', error => {
    console.error(error)
  })
  return virtualConsole
}
