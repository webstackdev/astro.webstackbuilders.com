// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import type { TestWebComponent as TestWebComponentInstance } from '@components/Test/webComponent'
import { withLitRuntime } from '@test/unit/helpers/litRuntime'

type TestWebComponentModule = typeof import('@components/Test/webComponent')
type TestWebComponentAstroModule = typeof import('@components/Test/webComponent.astro')

let TestWebComponentAstro: TestWebComponentAstroModule['default']
let TestWebComponentCtor: TestWebComponentModule['TestWebComponent']
let registerTestWebComponent: TestWebComponentModule['registerTestWebComponent']

beforeAll(async () => {
  GlobalRegistrator.register()
  const [astroComponent, componentModule] = await Promise.all([
    import('@components/Test/webComponent.astro'),
    import('@components/Test/webComponent'),
  ])

  TestWebComponentAstro = astroComponent.default
  TestWebComponentCtor = componentModule.TestWebComponent
  registerTestWebComponent = componentModule.registerTestWebComponent
})

afterAll(async () => {
  await GlobalRegistrator.unregister()
})

describe('Test web component rendering via Astro Container API', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('container output references compiled client bundle instead of inlining code', async () => {
    const result = await container.renderToString(TestWebComponentAstro, {
      props: {
        heading: 'Test',
      },
    })

    expect(result).toMatchInlineSnapshot(
      `"<test-web-component class=\"test-web-component\" data-testid=\"test-web-component\" data-astro-cid-7wyxbui3=\"true\"> <h2 data-astro-cid-7wyxbui3>Test</h2> </test-web-component>  <script type=\"module\" src=\"/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/src/components/Test/webComponent.astro?astro&type=script&index=0&lang.ts\"></script>"`,
    )

    expect(result).toContain('<test-web-component')
  })
})

describe('TestWebComponent class behavior', () => {
  const runtimeTagName = 'test-web-component-spec'

  test('renders default message in light DOM', async () => {
    await withLitRuntime(async ({ register, mount }) => {
      await register(runtimeTagName, (tagName) => registerTestWebComponent(tagName))
      expect(customElements.get(runtimeTagName)).toBe(TestWebComponentCtor)

      const element = await mount<TestWebComponentInstance>(runtimeTagName)

      expect(element.querySelector('#message')?.textContent).toBe('Hello from Lit')
    })
  })

  test('updates DOM when message changes', async () => {
    await withLitRuntime(async ({ register, mount }) => {
      await register(runtimeTagName, (tagName) => registerTestWebComponent(tagName))
      expect(customElements.get(runtimeTagName)).toBe(TestWebComponentCtor)

      const element = await mount<TestWebComponentInstance>(runtimeTagName)

      element.message = 'Updated message'
      await element.updateComplete

      expect(element.querySelector('#message')?.textContent).toBe('Updated message')
    })
  })
})
