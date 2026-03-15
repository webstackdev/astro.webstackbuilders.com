import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import FileExplorerAstro from '@components/FileExplorer/index.astro'
import type { FileExplorerComponent } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

const pressKey = (element: HTMLElement, key: string): void => {
  const keyboardEvent = new element.ownerDocument.defaultView!.KeyboardEvent('keydown', {
    key,
    bubbles: true,
  })

  element.dispatchEvent(keyboardEvent)
}

type FileExplorerModule = WebComponentModule<FileExplorerComponent>

describe('FileExplorer class behavior', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const mockData = [
    {
      type: 'folder',
      name: 'src',
      note: 'Application source files and test fixtures.',
      children: [
        { type: 'file', name: 'index.ts', comment: 'Main entry', note: 'Primary FileExplorer implementation.' },
      ],
    },
    { type: 'file', name: 'package.json' },
  ]

  const renderArgs = {
    props: {
      data: mockData,
      figure: 'Figure <strong>caption</strong>',
    },
  }

  const runComponentRender = async (
    assertion: (_context: { element: FileExplorerComponent }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<FileExplorerModule>({
      container,
      component: FileExplorerAstro,
      moduleSpecifier: '@components/FileExplorer/client/index',
      args: renderArgs,
      waitForReady: async (element: FileExplorerComponent) => {
        await element.updateComplete
      },
      assert: async ({
        element,
        module,
        renderResult,
      }: {
        element: FileExplorerComponent
        module: FileExplorerModule
        renderResult: string
      }) => {
        expect(renderResult).toContain(`<${module.registeredName}`)
        await assertion({ element })
      },
    })
  }

  test('renders hierarchical file systems based on data prop', async () => {
    await runComponentRender(async ({ element }) => {
      const root = element

      const nodes = root.querySelectorAll('.node-name')
      expect(nodes.length).toBe(3)

      const folderNames = Array.from(nodes).map(n => n.textContent?.trim())
      expect(folderNames).toContain('src')
      expect(folderNames).toContain('index.ts')
      expect(folderNames).toContain('package.json')

      const comments = root.querySelectorAll('.comment')
      expect(comments.length).toBe(1)
      const firstComment = comments.item(0)
      expect(firstComment).toBeTruthy()
      expect(firstComment?.textContent?.trim()).toBe('# Main entry')

      const tooltips = root.querySelectorAll('[role="tooltip"]')
      expect(tooltips.length).toBe(2)
      const tooltipTexts = Array.from(tooltips).map((tooltip) => tooltip.textContent?.trim())
      expect(tooltipTexts).toContain('Application source files and test fixtures.')
      expect(tooltipTexts).toContain('Primary FileExplorer implementation.')

      const figure = root.querySelector('figure')
      expect(figure).toBeTruthy()

      const figcaption = root.querySelector('figcaption')
      expect(figcaption).toBeTruthy()
      expect(figcaption?.textContent?.trim()).toBe('Figure caption')
      expect(figcaption?.querySelector('strong')?.textContent).toBe('caption')

      const tree = root.querySelector('[role="tree"]')
      expect(tree).toBeTruthy()

      const folderTreeItem = root.querySelector<HTMLElement>('[data-treeitem-path="0"]')
      expect(folderTreeItem?.getAttribute('role')).toBe('treeitem')
      expect(folderTreeItem?.getAttribute('aria-controls')).toBeTruthy()
      expect(folderTreeItem?.getAttribute('aria-level')).toBe('1')

      const childGroup = root.querySelector('[role="group"]')
      expect(childGroup).toBeTruthy()

      const decorativeIcons = root.querySelectorAll('svg[aria-hidden="true"]')
      expect(decorativeIcons.length).toBeGreaterThan(0)
    })
  })

  test('collapses and expands directories when the folder row is clicked', async () => {
    await runComponentRender(async ({ element }) => {
      const toggle = element.querySelector<HTMLButtonElement>('button[data-node-path="0"]')
      const indicator = toggle?.querySelector('[data-toggle-indicator]')

      expect(toggle).toBeTruthy()
      expect(indicator).toBeTruthy()
      expect(toggle?.getAttribute('aria-expanded')).toBe('true')
      expect(element.textContent).toContain('index.ts')

      toggle?.click()
      await element.updateComplete

      expect(toggle?.getAttribute('aria-expanded')).toBe('false')
      expect(element.textContent).not.toContain('index.ts')

      toggle?.click()
      await element.updateComplete

      expect(toggle?.getAttribute('aria-expanded')).toBe('true')
      expect(element.textContent).toContain('index.ts')
    })
  })

  test('supports tree keyboard navigation and roving tabindex', async () => {
    await runComponentRender(async ({ element }) => {
      const rootTreeItem = element.querySelector<HTMLElement>('[data-treeitem-path="0"]')
      const childTreeItem = element.querySelector<HTMLElement>('[data-treeitem-path="0/0"]')

      expect(rootTreeItem).toBeTruthy()
      expect(childTreeItem).toBeTruthy()
      expect(rootTreeItem?.getAttribute('tabindex')).toBe('0')
      expect(childTreeItem?.getAttribute('tabindex')).toBe('-1')

      rootTreeItem?.focus()
      pressKey(rootTreeItem!, 'ArrowDown')
      await element.updateComplete

      expect(childTreeItem?.getAttribute('tabindex')).toBe('0')

      pressKey(rootTreeItem!, 'ArrowLeft')
      await element.updateComplete
      expect(rootTreeItem?.getAttribute('aria-expanded')).toBe('false')

      pressKey(rootTreeItem!, 'ArrowRight')
      await element.updateComplete
      expect(rootTreeItem?.getAttribute('aria-expanded')).toBe('true')
    })
  })
})
