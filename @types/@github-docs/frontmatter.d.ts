declare module '@github-docs/frontmatter' {
  export type AllPagesSchemas = {
    /** A glob pattern used to match for files that should conform to schemas in `properties` */
    glob: string
    /** An array of schema names that the files matched by `glob` should conform to */
    properties: string[]
  }

  /* eslint-disable tsdoc/syntax, @typescript-eslint/no-explicit-any */
  type Formats =
    | 'url'
    | 'email'
    | 'ip-address'
    | 'ipv6'
    | 'date-time'
    | 'date'
    | 'time'
    | 'color'
    | 'host-name'
    | 'utc-millisec'
    | 'regex'

  type ValueType = 'string' | 'number' | 'integer' | 'array' | 'boolean' | 'object' | 'null' | 'any'

  interface IFrontmatterSchema {
    /**The type of value should be equal to the expected value */
    type: ValueType | ValueType[]
    /**If true, the value should not be undefined */
    required?: boolean | undefined
    /**The expected value regex needs to be satisfied by the value */
    pattern?: RegExp | string | undefined
    /**The length of value must be greater than or equal to expected value */
    maxLength?: number | undefined
    /**Description for this object */
    description?: string | undefined
    /**The length of value must be lesser than or equal to expected value */
    minLength?: number | undefined
    /**Value must be greater than or equal to the expected value */
    minimum?: number | undefined
    /**Value must be lesser than or equal to the expected value */
    maximum?: number | undefined
    /**If false, the value must not be an empty string */
    allowEmpty?: boolean | undefined
    /**Value must be greater than expected value */
    exclusiveMinimum?: number | undefined
    /**Value must be lesser than expected value */
    exclusiveMaximum?: number | undefined
    /**Value must be divisible by expected value */
    divisibleBy?: number | undefined
    /**Value must contain more than expected number of items */
    minItems?: number | undefined
    /**Value must contain fewer than expected number of items */
    maxItems?: number | undefined
    /**Value must hold a unique set of values */
    uniqueItems?: boolean | undefined
    /**Value must be present in the array of expected values */
    enum?: any[] | undefined
    /**Custom messages for different constraints */
    message?: string | undefined
    /**Custom messages for different constraints */
    messages?: { [index: string]: string } | undefined
    /**Default value */
    default?: any
    /**Value must be a valid format */
    format?: Formats | undefined
    /**Value must conform to constraint denoted by expected value */
    conform?: ((value: any, data?: unknown) => boolean) | undefined
    /**Value is valid only if the dependent value is valid */
    dependencies?: string | undefined
    /**Property to describe items for type: 'array' */
    items?: IFrontmatterSchema | IJsonFrontmatterSchema | undefined
  }

  interface IJsonFrontmatterSchema {
    type?: 'object' | undefined
    properties?: { [index: string]: IFrontmatterSchema } | IFrontmatterSchema | undefined
    patternProperties?: IFrontmatterSchema | undefined
  }

  export interface FrontmatterSchema {
    [index: string]: IFrontmatterSchema | IJsonFrontmatterSchema
  }

  export interface FrontmatterOptions {
    /**
     * The schema to validate against
     *
     * @default { properties: {} }
     */
    schema: FrontmatterSchema
    /**
     * The name of the file being parsed. Useful for debugging when errors occur.
     *
     * @default false
     */
    filepath?: string
    /**
     * If true, checks that all keys are specified as schema properties.
     *
     * @default false
     */
    validateKeyNames?: boolean
    /**
     * If true, checks that all keys are in the same order they appear in the schema.
     *
     * @default false
     */
    validateKeyOrder?: boolean
  }

  interface MarkdownObject {
    content: any
    [key: string]: any
  }
  /* eslint-enable tsdoc/syntax, @typescript-eslint/no-explicit-any */

  function frontmatter(
    markdown: string | MarkdownObject,
    opts: FrontmatterOptions
  ): {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { [key: string]: any } | undefined
    content: string | undefined
    errors: Error[] | undefined
  }
  export default frontmatter
}
