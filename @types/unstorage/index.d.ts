declare module 'unstorage' {
  const createStorage: unknown
  export default createStorage
}

declare module 'unstorage/*' {
  const driver: unknown
  export default driver
}

declare module 'unstorage/*.mjs' {
  const driver: unknown
  export default driver
}

declare module 'unstorage/drivers' {
  const driver: unknown
  export default driver
}

declare module 'unstorage/drivers/*' {
  const driver: unknown
  export default driver
}

declare module 'unstorage/drivers/*.mjs' {
  const driver: unknown
  export default driver
}

declare module 'unstorage/drivers/utils/*' {
  const driver: unknown
  export default driver
}
