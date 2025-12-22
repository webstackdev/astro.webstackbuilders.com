declare module '*.svg' {
  const content: unknown
  export default content
}

declare module '*.svg?raw' {
  const content: string
  export default content
}
