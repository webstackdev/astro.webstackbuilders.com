import { LitElement, html, nothing } from 'lit'
import type { TemplateResult } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { queryFileExplorerTreeItem } from './selectors'

export type FileSystemNode = {
  type: 'folder' | 'file'
  name: string
  children?: FileSystemNode[]
  comment?: string
  note?: string
}

export class FileExplorerComponent extends LitElement {
  static registeredName = 'file-explorer'
  private static nextInstanceId = 0

  static override properties = {
    fileSystemData: { type: Array, attribute: 'data-file-system' },
    figure: { type: String, attribute: 'data-figure' },
  }

  // Renders into the light DOM to allow Tailwind classes to apply natively
  protected override createRenderRoot(): this {
    return this
  }

  declare fileSystemData: FileSystemNode[]
  declare figure: string
  private collapsedPaths = new Set<string>()
  private focusedPath = ''
  private instanceId: number

  constructor() {
    super()
    FileExplorerComponent.nextInstanceId += 1
    this.instanceId = FileExplorerComponent.nextInstanceId
    this.fileSystemData = []
    this.figure = ''
  }

  protected override willUpdate(): void {
    if (!this.isPathVisible(this.focusedPath)) {
      this.focusedPath = this.getFirstVisiblePath()
    }
  }

  private getNodePath(parentPath: string, index: number): string {
    return parentPath ? `${parentPath}/${index}` : `${index}`
  }

  private getFigureId(): string {
    return `file-explorer-figure-${this.instanceId}`
  }

  private getTreeId(): string {
    return `file-explorer-tree-${this.instanceId}`
  }

  private getNoteId(path: string): string {
    return `file-explorer-note-${this.instanceId}-${path.replaceAll('/', '-')}`
  }

  private getGroupId(path: string): string {
    return `file-explorer-group-${this.instanceId}-${path.replaceAll('/', '-')}`
  }

  private isCollapsibleFolder(node: FileSystemNode): boolean {
    return node.type === 'folder' && (node.children?.length ?? 0) > 0
  }

  private getFirstVisiblePath(): string {
    return this.getVisiblePaths()[0] ?? ''
  }

  private isPathVisible(path: string): boolean {
    return this.getVisiblePaths().includes(path)
  }

  private getVisiblePaths(
    nodes: FileSystemNode[] = this.fileSystemData,
    parentPath = ''
  ): string[] {
    return nodes.flatMap((node, index) => {
      const path = this.getNodePath(parentPath, index)
      const visiblePaths = [path]

      if (this.isCollapsibleFolder(node) && !this.collapsedPaths.has(path) && node.children) {
        visiblePaths.push(...this.getVisiblePaths(node.children, path))
      }

      return visiblePaths
    })
  }

  private getPathDepth(path: string): number {
    return path ? path.split('/').length : 1
  }

  private focusTreeItem(path: string): void {
    this.focusedPath = path
    this.requestUpdate()

    void this.updateComplete.then(() => {
      const treeItem = queryFileExplorerTreeItem(this, path)
      treeItem?.focus()
    })
  }

  private handleTreeItemFocus(path: string): void {
    if (this.focusedPath !== path) {
      this.focusedPath = path
      this.requestUpdate()
    }
  }

  private handleTreeItemKeyDown(event: KeyboardEvent, node: FileSystemNode, path: string): void {
    const visiblePaths = this.getVisiblePaths()
    const currentIndex = visiblePaths.indexOf(path)
    const isCollapsible = this.isCollapsibleFolder(node)
    const isCollapsed = isCollapsible && this.collapsedPaths.has(path)
    const parentPath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (currentIndex < visiblePaths.length - 1) {
          const nextPath = visiblePaths[currentIndex + 1]
          if (nextPath) {
            this.focusTreeItem(nextPath)
          }
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (currentIndex > 0) {
          const previousPath = visiblePaths[currentIndex - 1]
          if (previousPath) {
            this.focusTreeItem(previousPath)
          }
        }
        break
      case 'Home':
        event.preventDefault()
        if (visiblePaths.length > 0) {
          const firstPath = visiblePaths[0]
          if (firstPath) {
            this.focusTreeItem(firstPath)
          }
        }
        break
      case 'End':
        event.preventDefault()
        if (visiblePaths.length > 0) {
          const lastPath = visiblePaths[visiblePaths.length - 1]
          if (lastPath) {
            this.focusTreeItem(lastPath)
          }
        }
        break
      case 'ArrowRight':
        if (!isCollapsible) {
          return
        }

        event.preventDefault()
        if (isCollapsed) {
          this.toggleCollapsed(path)
          this.focusTreeItem(path)
          return
        }

        if (node.children && node.children.length > 0) {
          this.focusTreeItem(this.getNodePath(path, 0))
        }
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (isCollapsible && !isCollapsed) {
          this.toggleCollapsed(path)
          this.focusTreeItem(path)
          return
        }

        if (parentPath) {
          this.focusTreeItem(parentPath)
        }
        break
      case 'Enter':
      case ' ':
        if (!isCollapsible) {
          return
        }

        event.preventDefault()
        this.toggleCollapsed(path)
        this.focusTreeItem(path)
        break
      default:
        break
    }
  }

  private toggleCollapsed(path: string): void {
    if (this.collapsedPaths.has(path)) {
      this.collapsedPaths.delete(path)
    } else {
      this.collapsedPaths.add(path)
    }

    this.requestUpdate()
  }

  private renderFolderIcon(): TemplateResult {
    return html`
      <span
        aria-hidden="true"
        class="mr-2 inline-flex items-center text-secondary transition-colors group-hover:text-page-inverse group-focus-visible:text-page-inverse node-icon folder-icon"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          class="h-6 w-6 fill-current icon-svg"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
          />
        </svg>
      </span>
    `
  }

  private renderFileIcon(): TemplateResult {
    return html`
      <span
        aria-hidden="true"
        class="mr-2 inline-flex items-center text-(--color-content-offset) node-icon file-icon"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          class="h-6 w-6 fill-current icon-svg"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
          />
        </svg>
      </span>
    `
  }

  private renderToggleIndicator(isCollapsed: boolean): TemplateResult {
    return html`
      <span
        aria-hidden="true"
        data-toggle-indicator
        class="mr-2 inline-flex w-4 shrink-0 items-center justify-center text-(--color-trim) transition-colors group-hover:text-trim-offset group-focus-visible:text-trim-offset"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          class="h-4 w-4 fill-none stroke-current transition-transform ${isCollapsed
            ? ''
            : 'rotate-90'}"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M7 5l6 5-6 5" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
        </svg>
      </span>
    `
  }

  private renderNote(note: string, path: string, nodeName: string): TemplateResult {
    const noteId = this.getNoteId(path)

    return html`
      <span class="group/note relative ml-3 inline-flex items-center">
        <button
          type="button"
          class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-trim bg-page-base text-[0.6875rem] font-semibold leading-none text-secondary transition-colors hover:border-secondary hover:text-page-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spotlight"
          aria-describedby="${noteId}"
          aria-label="Note for ${nodeName}"
        >
          i
        </button>
        <span
          id="${noteId}"
          role="tooltip"
          class="pointer-events-none absolute left-0 top-full z-(--z-content-floating) mt-2 w-64 -translate-y-1 rounded-lg border border-trim bg-page-inverse px-3 py-2 text-sm leading-relaxed text-page-base opacity-0 shadow-elevated transition-all duration-200 group-hover/note:translate-y-0 group-hover/note:opacity-100 group-focus-within/note:translate-y-0 group-focus-within/note:opacity-100"
        >
          ${note}
        </span>
      </span>
    `
  }

  private renderNode(node: FileSystemNode, path: string, isRoot = false): TemplateResult {
    const isFolder = node.type === 'folder'
    const isCollapsible = this.isCollapsibleFolder(node)
    const isCollapsed = isCollapsible && this.collapsedPaths.has(path)
    const groupId = this.getGroupId(path)
    const treeItemTabIndex = this.focusedPath === path ? '0' : '-1'
    const treeItemLevel = String(this.getPathDepth(path))
    // Tree lines using tailwind pseudo classes
    const liClasses = isRoot
      ? 'relative'
      : "relative before:content-[''] before:absolute before:top-[0.8rem] before:-left-6 before:w-5 before:border-t before:border-dashed before:border-(--color-trim) last:border-l last:border-solid last:border-(--color-page-base) last:-ml-6 last:pl-6 last:before:left-0"

    return html`
      <li role="none" class="${liClasses}">
        ${isCollapsible
          ? html`
              <div class="flex items-center">
                <button
                  type="button"
                  class="group flex w-full items-center py-1 text-left whitespace-nowrap node"
                  data-node-path="${path}"
                  data-treeitem-path="${path}"
                  role="treeitem"
                  aria-controls="${groupId}"
                  aria-expanded="${isCollapsed ? 'false' : 'true'}"
                  aria-level="${treeItemLevel}"
                  tabindex="${treeItemTabIndex}"
                  @focus=${() => this.handleTreeItemFocus(path)}
                  @keydown=${(event: KeyboardEvent) =>
                    this.handleTreeItemKeyDown(event, node, path)}
                  @click=${() => this.toggleCollapsed(path)}
                >
                  ${this.renderToggleIndicator(isCollapsed)} ${this.renderFolderIcon()}
                  <span class="text-base text-(--color-content) node-name font-medium"
                    >${node.name}</span
                  >
                  ${node.comment
                    ? html`<span class="ml-6 text-(--color-content-offset) italic comment"
                        ># ${node.comment}</span
                      >`
                    : ''}
                </button>
                ${node.note ? this.renderNote(node.note, path, node.name) : ''}
              </div>
            `
          : html`
              <div class="flex items-center">
                <div
                  class="group flex items-center py-1 whitespace-nowrap node"
                  data-treeitem-path="${path}"
                  role="treeitem"
                  aria-level="${treeItemLevel}"
                  tabindex="${treeItemTabIndex}"
                  @focus=${() => this.handleTreeItemFocus(path)}
                  @keydown=${(event: KeyboardEvent) =>
                    this.handleTreeItemKeyDown(event, node, path)}
                >
                  ${isFolder ? this.renderFolderIcon() : this.renderFileIcon()}
                  <span
                    class="text-base text-(--color-content) node-name ${isFolder
                      ? 'font-medium'
                      : 'font-normal file-name'}"
                    >${node.name}</span
                  >
                  ${node.comment
                    ? html`<span class="ml-6 text-(--color-content-offset) italic comment"
                        ># ${node.comment}</span
                      >`
                    : ''}
                </div>
                ${node.note ? this.renderNote(node.note, path, node.name) : ''}
              </div>
            `}
        ${isCollapsible && !isCollapsed && node.children
          ? html`
              <ul
                id="${groupId}"
                role="group"
                class="list-none p-0 m-0 pl-6 border-l border-dashed border-(--color-trim) ml-2 children"
              >
                ${node.children.map((child, index) =>
                  this.renderNode(child, this.getNodePath(path, index), false)
                )}
              </ul>
            `
          : ''}
      </li>
    `
  }

  protected override render(): TemplateResult {
    return html`
      <figure class="block">
        <div
          class="font-mono text-sm leading-relaxed p-6 bg-(--color-page-base) rounded-lg overflow-x-auto"
        >
          <ul
            id="${this.getTreeId()}"
            role="tree"
            aria-label="${this.figure ? nothing : 'File explorer'}"
            aria-labelledby="${this.figure ? this.getFigureId() : nothing}"
            class="list-none p-0 m-0 tree-root"
          >
            ${this.fileSystemData?.map((node, index) =>
              this.renderNode(node, this.getNodePath('', index), true)
            )}
          </ul>
        </div>
        ${this.figure
          ? html`<figcaption
              id="${this.getFigureId()}"
              class="mx-auto mt-3 w-fit max-w-full text-center text-base italic"
            >
              ${unsafeHTML(this.figure)}
            </figcaption>`
          : ''}
      </figure>
    `
  }
}

export const registerFileExplorer = async (tagName = FileExplorerComponent.registeredName) => {
  defineCustomElement(tagName, FileExplorerComponent)
}

export const webComponentModule: WebComponentModule<FileExplorerComponent> = {
  registeredName: FileExplorerComponent.registeredName,
  componentCtor: FileExplorerComponent,
  registerWebComponent: registerFileExplorer,
}
