import { JSDOM } from 'jsdom'
import { getJsdomEnv } from '../../__fixtures__/jsdomEnv'

export function isJsdom(value: unknown): value is JSDOM {
  return !!value && (value instanceof JSDOM)
}

/**
 * Node environment tests for custom Jest environment units
 */

describe('JSDomTscompileEnvironment', () => {
  it('should configure setTimeout / setInterval to use the browser api', () => {
    const sut = getJsdomEnv()
    sut.fakeTimers!.useFakeTimers()
    const timer1 = sut.global.setTimeout(() => {}, 0)
    const timer2 = sut.global.setInterval(() => {}, 0)
    ;[timer1, timer2].forEach(timer => {
      expect(typeof timer).toBe('number')
    })
  })

  it('has modern fake timers implementation', () => {
    const sut = getJsdomEnv()
    expect(sut.fakeTimersModern).toBeDefined()
  })

  it('should respect userAgent option', () => {
    const { dom } = getJsdomEnv({ userAgent: 'foo' })
    expect(isJsdom(dom)).toBeTruthy()
    // @ts-ignore type of dom is narrowed but TS can't see that expect short-circuits test
    expect(dom.window.navigator.userAgent).toBe('foo')
  })

  it('should provide default for url', () => {
    const sut = getJsdomEnv()
    expect(isJsdom(sut.dom)).toBeTruthy()
    // @ts-ignore type of dom is narrowed but TS can't see that expect short-circuits test
    expect(sut.dom.window.location.href).toBe('http://localhost:8081/')
  })

  it('should respect url option passed as option', () => {
    const sut = getJsdomEnv({ url: 'https://jestjs.io' })
    expect(isJsdom(sut.dom)).toBeTruthy()
    // @ts-ignore type of dom is narrowed but TS can't see that expect short-circuits test
    expect(sut.dom.window.location.href).toBe('https://jestjs.io/')
  })

  /**
   * When used in conjunction with Custom Elements (part of the WebComponents standard)
   * setting the global.document to null too early is problematic because:
   *
   * CustomElement's disconnectedCallback method is called when a custom element
   * is removed from the DOM. The disconnectedCallback could need the document
   * in order to remove some listener for example.
   *
   * global.close calls jsdom's Window.js.close which does this._document.body.innerHTML = "".
   * The custom element will be removed from the DOM at this point, therefore disconnectedCallback
   * will be called, so please make sure the global.document is still available at this point.
   */
  it('should not set the global.document to null too early', () => {
    const sut = getJsdomEnv()
    const originalCloseFn = sut.global.close.bind(sut.global)
    sut.global.close = () => {
      originalCloseFn()
      expect(sut.global.document).not.toBeNull()
    }
    return sut.teardown()
  })

  it('', () => {
    /*
      Object.setPrototypeOf(window, Window.prototype)

      // In test:

      console.log(window instanceof Window) // true

      // Add test for this, this used to output false:

      <body>
        <script>
          console.log(window instanceof Window)
        </script>
      </body>
    */
    expect(true).toBeTruthy()
  })
})
