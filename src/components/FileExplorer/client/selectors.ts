const treeItemSelector = (path: string): string => `[data-treeitem-path="${path}"]`

export const queryFileExplorerTreeItem = (scope: ParentNode, path: string): HTMLElement | null => {
  return scope.querySelector<HTMLElement>(treeItemSelector(path))
}
