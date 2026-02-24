import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ServicesPageAstro from '@components/Pages/Services/index.astro'
import type { ServicesPageElement as ServicesPageElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type ServicesPageModule = WebComponentModule<ServicesPageElementInstance>

describe('ServicesPageElement class behavior', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const renderArgs = {
    props: {
      services: [
        {
          id: 'full-workstream',
          data: {
            title: 'Full Workstream',
            description: 'End-to-end delivery for product and web initiatives.',
          },
          rendered: {
            html: '<h2>Scope</h2><p>Design and implementation.</p><h2>Outcome</h2><p>Launch-ready delivery.</p>',
          },
        },
      ],
    },
  }

  const runComponentRender = async (
    assertion: (_context: { element: ServicesPageElementInstance }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<ServicesPageModule>({
      container,
      component: ServicesPageAstro,
      moduleSpecifier: '@components/Pages/Services/client/index',
      args: renderArgs,
      waitForReady: async (element: ServicesPageElementInstance) => {
        await element.updateComplete
      },
      assert: async ({
        element,
        module,
        renderResult,
      }: {
        element: ServicesPageElementInstance
        module: ServicesPageModule
        renderResult: string
      }) => {
        expect(renderResult).toContain(`<${module.registeredName}`)
        await assertion({ element })
      },
    })
  }

  test('renders services custom element in light DOM', async () => {
    await runComponentRender(async ({ element }) => {
      expect(element.querySelector('section')).not.toBeNull()
      expect(element.querySelector('[data-service-card]')).not.toBeNull()
    })
  })

  test('renders service content from props', async () => {
    await runComponentRender(async ({ element }) => {
      expect(element.textContent).toContain('Full Workstream')
      expect(element.textContent).toContain('Most Popular')
    })
  })
})
