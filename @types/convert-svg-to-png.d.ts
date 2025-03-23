declare module 'convert-svg-to-png' {
  interface ConverterOptions {
    /**
     * Whether deprecated SVG element attributes should be retained in the SVG during conversion.
     *
     * @default true
     */
    allowDeprecatedAttributes?: boolean

    /**
     * Background color to be used to fill transparent regions within the SVG. Will remain transparent if omitted.
     */
    background?: string

    /**
     * Path of the file to be converted into a file URL to use for all relative URLs
     * contained within the SVG. Cannot be used in conjunction with the baseUrl option.
     */
    baseFile?: string

    /**
     * Base URL to use for all relative URLs contained within the SVG. Cannot be used
     * in conjunction with the baseFile option.
     *
     * @default `file:///path/to/cwd``
     */
    baseUrl?: string

    /**
     * Height of the output to be generated. Derived from SVG input if omitted.
     */
    height?: number | string

    /**
     * Options that are to be passed directly to puppeteer.launch when creating
     * the Browser instance.
     */
    /* eslint-disable-next-line @typescript-eslint/ban-types */
    puppeteer?: Object

    /**
     * Type of rounding to be applied to the width and height.
     *
     * @default `round
     */
    rounding?: `ceil` | `floor` | `round`

    /**
     * Scale to be applied to the width and height (specified as options or derived).
     *
     * @default 1
     */
    scale?: number

    /**
     * Width of the output to be generated. Derived from SVG input if omitted.
     */
    width?: number | string
  }

  interface FileOptions {
    /**
     * Path of the file to which the PNG output should be written to. Derived from
     * input file path if omitted.
     *
     * @default The input file path if no value is given
     */
    outputFilePath?: string
  }

  interface Converter {
    new (provider: unknown, options: ConverterOptions)
    convertFile(inputFilePath: string, options?: ConverterOptions & FileOptions): Promise<string>
    destroy(): Promise<void>
  }

  export function createConverter(options?: ConverterOptions): Converter
}
