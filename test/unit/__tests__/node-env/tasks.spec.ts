import { describe, expect, test, beforeEach } from '@jest/globals'
import { resolve } from 'path'

const getFixturePath = (fileName: string) => {
  return resolve(__dirname, '../../__fixtures__/compileTs', fileName)
}

const templatePath = resolve(`test/jest/__fixtures__/loadHtmlTemplate.njk`)

let tasks: any
beforeEach(() => {
  jest.resetAllMocks()
})

describe(`tsCompile compiles inline Typescript script`, () => {
  test(`compiles valid Typescript`, async () => {
    // here due to scope
    jest.isolateModules(() => {
      /* eslint-disable-next-line node/no-missing-require */
      tasks = require('../../helpers/workers/tasks')
    })
    jest.mock('../../helpers/workers/pool') // must follow require

    const fixturePath = getFixturePath(`compileTs_1.ts`)
    const sut = await tasks.tsCompile(fixturePath)
    //expect(sut).toEqual(expect.stringContaining(`const foo = (input) => { return input; };`))
    expect(sut).toMatchInlineSnapshot
    await tasks.cleanup()
  })

  test(`sanity check on shared module state between tests`, async () => {
    // here due to scope
    jest.isolateModules(() => {
      /* eslint-disable-next-line node/no-missing-require */
      tasks = require('../../helpers/workers/tasks')
    })
    jest.mock('../../helpers/workers/pool') // must follow require

    const fixturePath = getFixturePath(`compileTs_1.ts`)
    const sut = await tasks.tsCompile(fixturePath)
    expect(sut).toEqual(expect.stringContaining(`const foo = (input) => { return input; };`))
    await tasks.cleanup()
  })

  test(`throws if script file does not exist`, async () => {
    // here due to scope
    jest.isolateModules(() => {
      /* eslint-disable-next-line node/no-missing-require */
      tasks = require('../../helpers/workers/tasks')
    })
    jest.mock('../../helpers/workers/pool') // must follow require

    const fixturePath = getFixturePath(`nonexistent.ts`)
    await expect(tasks.tsCompile(fixturePath)).rejects.toThrow()
    await tasks.cleanup()
  })

  test(`compiles when fake timers in use`, async () => {
    // here due to scope
    jest.isolateModules(() => {
      /* eslint-disable-next-line node/no-missing-require */
      tasks = require('../../helpers/workers/tasks')
    })
    jest.mock('../../helpers/workers/pool') // must follow require

    jest.useFakeTimers()
    const fixturePath = getFixturePath(`compileTs_1.ts`)
    await expect(tasks.tsCompile(fixturePath)).resolves.toEqual(
      expect.stringContaining(`const foo = (input) => { return input; };`)
    )
    await tasks.cleanup()
    jest.useRealTimers()
  })
})

describe('Loads a template file', () => {
  test('loadHtmlTemplate should return an HTML string', async () => {
    // here due to scope
    jest.isolateModules(() => {
      /* eslint-disable-next-line node/no-missing-require */
      tasks = require('../../helpers/workers/tasks')
    })
    jest.mock('../../helpers/workers/pool') // must follow require

    const sut = await tasks.loadHtmlTemplate(templatePath)
    expect(sut).toContain(
      `<p id="test__paragraph">This is a <a id="test__anchor" href="/test">test template</a>.</p>`
    )
    await tasks.cleanup()
  })

  // @TODO: test is not loading the manual mock for pool.ts, although other tests are
  test.skip(`throws if template file does not exist`, async () => {
    // here due to scope
    jest.isolateModules(() => {
      /* eslint-disable-next-line node/no-missing-require */
      tasks = require('../../helpers/workers/tasks')
    })
    jest.mock('../../helpers/workers/pool') // must follow require

    expect.assertions(1)
    try {
      await tasks.loadHtmlTemplate(`nonexistent.ts`)
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[Error: Global worker pool not a valid instance of WorkerPool]`
      )
    }
    await tasks.cleanup()
  })

  // Jest has detected the following 1 open handle potentially keeping Jest from exiting:
  // > 61 |       this.staticPool = new StaticPool({
  test.skip('loadHtmlTemplate works with fake timers', async () => {
    // here due to scope
    jest.isolateModules(() => {
      /* eslint-disable-next-line node/no-missing-require */
      tasks = require('../../helpers/workers/tasks')
    })
    jest.mock('../../helpers/workers/pool') // must follow require

    jest.useFakeTimers()
    const sut = await tasks.loadHtmlTemplate(templatePath)
    expect(sut).toContain(
      `<p id="test__paragraph">This is a <a id="test__anchor" href="/test">test template</a>.</p>`
    )
    jest.useRealTimers()
    await tasks.cleanup()
  })
})
