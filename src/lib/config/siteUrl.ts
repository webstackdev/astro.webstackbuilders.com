import { loadEnv } from 'vite'

const { DEV_SERVER_PORT, PREVIEW_SERVER_PORT } = loadEnv('production', process.cwd(), '')

export const getSiteUrl = (): string => {
  switch (process.env['NODE_ENV']) {
    case 'production':
      console.log(`Using production environment.`)
      return 'https://webstackbuilders.com'
    case 'development':
      console.log(`Using development environment on port ${DEV_SERVER_PORT ?? 4321}.`)
      return `http://localhost:${DEV_SERVER_PORT ?? 4321}`
    case 'test':
      console.log(`Using test environment on port ${DEV_SERVER_PORT ?? 4321}.`)
      return `http://localhost:${PREVIEW_SERVER_PORT ?? 4321}`
    default:
      console.log(`The NODE_ENV environment variable is not set, using "production".`)
      return 'https://webstackbuilders.com'
  }
}
