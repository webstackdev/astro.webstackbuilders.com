/**
 * JSDOM quiet mode tests are numbered because they depend on a pragma
 * at the top of each test file contained within a TSDOC block.
 */
import { getEnvironmentContext } from '../../__fixtures__/jsdomQuietMode/JestEnvironmentConfig'
import { getJsdomQuietModeFlag } from '../../jsdomQuietMode/utility'

describe(`gets flag from single option in single @jest-environment-options pragma`, () => {
  test(`returns false if no @jest-environment-options pragma given`, () => {
    const context = getEnvironmentContext()
    const sut = getJsdomQuietModeFlag(context)
    expect(sut === false).toBeTruthy()
  })

  test(`gets flag from single option in single @jest-environment-options pragma when flag is true`, () => {
    const context = getEnvironmentContext('{"JSDOM_QUIET_MODE": true}')
    const sut = getJsdomQuietModeFlag(context)
    expect(sut === true).toBeTruthy()
  })

  test(`gets flag from single option in single @jest-environment-options pragma when flag is false`, () => {
    const context = getEnvironmentContext('{"JSDOM_QUIET_MODE": false}')
    const sut = getJsdomQuietModeFlag(context)
    expect(sut === false).toBeTruthy()
  })

  test(`gets flag from multiple @jest-environment-options pragmas`, () => {
    const context = getEnvironmentContext([
      '{"JSDOM_QUIET_MODE": true}',
      '{"something_else": false}',
    ])
    const sut = getJsdomQuietModeFlag(context)
    expect(sut === true).toBeTruthy()
  })

  test(`gets flag from multiple keys in single @jest-environment-options pragma`, () => {
    const context = getEnvironmentContext('{"JSDOM_QUIET_MODE": true, "something_else": false}')
    const sut = getJsdomQuietModeFlag(context)
    expect(sut === true).toBeTruthy()
  })
})
