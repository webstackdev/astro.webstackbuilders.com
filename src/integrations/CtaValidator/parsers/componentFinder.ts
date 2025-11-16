/**
 * Component finder utilities for CallToAction validator
 * Finds component usages within page files
 */

import type { CallToActionComponent, ComponentUsage } from '@integrations/CtaValidator/@types'

/**
 * Find all usages of a component in a file
 *
 * @param component - Component to search for
 * @param _content - Full file content
 * @param lines - File content split into lines
 * @param filePath - Path to the file being analyzed
 * @returns Array of component usages found
 */
export function findComponentUsages(
  component: CallToActionComponent,
  _content: string,
  lines: string[],
  filePath: string
): ComponentUsage[] {
  const usages: ComponentUsage[] = []

  for (const pattern of component.importPatterns) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line && line.includes(pattern)) {
        usages.push({
          componentName: component.name,
          filePath,
          lineNumber: i + 1,
          content: line,
        })
      }
    }
  }

  // Remove duplicate usages (same line number)
  const uniqueUsages = usages.reduce((acc, usage) => {
    const existing = acc.find((u) => u.lineNumber === usage.lineNumber)
    if (!existing) {
      acc.push(usage)
    }
    return acc
  }, [] as ComponentUsage[])

  return uniqueUsages
}

/**
 * Generate usage patterns for a CallToAction component (only component tags, not imports)
 *
 * @param componentName - Name of the component
 * @param _basePath - Base path (unused, kept for API compatibility)
 * @returns Array of usage patterns to search for
 */
export function generateImportPatterns(componentName: string, _basePath: string): string[] {
  const patterns = [
    // Component usage patterns only - NOT import statements
    `<${componentName}`,
    `<${componentName}/>`,
    `<${componentName} `,
  ]

  return patterns
}
