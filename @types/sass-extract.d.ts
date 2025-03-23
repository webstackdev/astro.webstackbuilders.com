declare module 'sass-extract' {
  import type { Result } from 'node-sass'
  type ExtractType =
    | `SassString`
    | `SassBoolean`
    | `SassNull`
    | `SassNumber`
    | `SassColor`
    | `SassList`
    | `SassMap`

  interface SassExtractReturn {
    global: {
      [key: string]: {
        type: ExtractType
        /** Path to the SCSS file */
        sources: string[]
        /** Extracted value */
        value: unknown
        /** Data type specific metadata e.g. 'px' */
        unit: string
        declarations: [
          /** Original expression, e.g. '12px' */
          expression: string,
          flags: { default: boolean, global: boolean },
          position?: { cursor: number, line: number, column: number },
        ]
      }
    }
  }

  interface CompileOptions {
    file: string
    includePaths?: string[]
  }

  interface ExtractOptions {
    [key: string]: string
  }

  export function renderSync(
    compileOptions: CompileOptions,
    extractOptions?: ExtractOptions
  ): SassExtractReturn

  export function extractSync(rendered: Result, options: CompileOptions)
}
