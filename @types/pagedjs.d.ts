declare module 'pagedjs' {
  export interface PagedJsList {
    appendList?: (_rules: unknown) => void
    remove?: (_entry: unknown) => void
  }

  export interface PagedJsHandlerInstance {
    getMediaName?(_node: unknown): unknown
    onAtMedia?(_node: unknown, _item: unknown, _list: PagedJsList): void
  }

  export interface PagedJsHandlerConstructor {
    new (..._args: never[]): PagedJsHandlerInstance
    name: string
  }

  export class Previewer {
    preview(): Promise<unknown>
  }

  export const registeredHandlers: PagedJsHandlerConstructor[]
}
