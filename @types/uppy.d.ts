declare module '@uppy/core' {
  export interface Restrictions {
    maxNumberOfFiles?: number
    maxFileSize?: number
    allowedFileTypes?: string[]
  }

  export interface UppyOptions {
    autoProceed?: boolean
    restrictions?: Restrictions
  }

  export interface UppyFile {
    id: string
    name: string
    data?: Blob | File
  }

  export default class Uppy {
    constructor(_options?: UppyOptions)
    use(_plugin: unknown, _options?: unknown): this
    getFiles(): UppyFile[]
    cancelAll(): void
    removeFiles(_fileIDs: string[]): void
    destroy(): void
  }
}

declare module '@uppy/dashboard' {
  export interface DashboardOptions {
    inline?: boolean
    target?: HTMLElement
    proudlyDisplayPoweredByUppy?: boolean
    hideUploadButton?: boolean
    hideProgressDetails?: boolean
  }

  export default class Dashboard {
    constructor(_uppy: unknown, _options: DashboardOptions)
  }
}
