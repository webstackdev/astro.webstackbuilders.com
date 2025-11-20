declare module 'unstorage' {
  const createStorage: any
  export default createStorage
}

declare module 'unstorage/*' {
  const driver: any
  export default driver
}

declare module 'unstorage/*.mjs' {
  const driver: any
  export default driver
}

declare module 'unstorage/drivers' {
  const driver: any
  export default driver
}

declare module 'unstorage/drivers/*' {
  const driver: any
  export default driver
}

declare module 'unstorage/drivers/*.mjs' {
  const driver: any
  export default driver
}

declare module 'unstorage/drivers/utils/*' {
  const driver: any
  export default driver
}
