/**
 * rehype-mermaid plugin
 */
import fs from 'node:fs'
import { BuildError } from '../errors/BuildError'

const readFileOrThrow = (filePath: string, encoding?: BufferEncoding) => {
  try {
    return fs.readFileSync(filePath, encoding)
  } catch (error) {
    throw new BuildError(
      new Error(`Mermaid config failed to read ${filePath}.`, { cause: error }),
      { phase: 'config-setup', tool: 'mermaid', filePath }
    )
  }
}

/** 1. Read production CSS that contains the .node / .label selectors */
const productionCss = readFileOrThrow('./src/styles/vendor/mermaid.css', 'utf-8')

/** 2. Read and encode fonts */
const fontBase64 = readFileOrThrow('./public/fonts/OnestRegular1602-hint.woff2').toString('base64')

/** 3. Construct a virtual CSS string for the headless browser */
const buildTimeCss = `
  @font-face {
    font-family: 'Onest Regular';
    src: url(data:font/woff2;charset=utf-8;base64,${fontBase64}) format('woff2');
    font-weight: normal;
    font-style: normal;
  }
  ${productionCss}
`
const buildTimeCssUrl = `data:text/css;charset=utf-8,${encodeURIComponent(buildTimeCss)}`

export const rehypeMermaidConfig = {
  strategy: 'inline-svg',
  css: buildTimeCssUrl,
  mermaidConfig: {
    securityLevel: 'loose',
    theme: 'base', /** Required to use custom themeVariables */
    'themeVariables': {
      /** Pie chart outer stroke width */
      pieOuterStrokeWidth: "1px",
      /** Pie chart colors */
      pie1: '#22c55e',
      pie2: '#3b82f6',
      pie3: '#f97316',
      pie4: '#ef4444',
      pie5: '#facc15',
      pie6: '#9333ea',
      pie7: '#6b7280',
    },
  },

  errorFallback: (_element: unknown, _diagram: string, error: unknown, file: unknown) => {
    const filePath =
      typeof (file as { path?: unknown } | null)?.path === 'string'
        ? ((file as { path: string }).path as string)
        : undefined

    throw new BuildError(new Error("Mermaid couldn't graph this diagram.", { cause: error }), {
      phase: 'compilation',
      tool: 'mermaid',
      filePath,
    })
  },
} as const
