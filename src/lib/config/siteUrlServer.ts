import { loadEnv } from 'vite'

const { DEV_SERVER_PORT } = loadEnv('production', process.cwd(), '')

export const getSiteUrl = (): string => {
  switch (process.env['NODE_ENV']) {
    case 'production':
      console.log(`Using production environment.`)
      return 'https://webstackbuilders.com'
    case 'development':
      console.log(`Using development environment on port ${DEV_SERVER_PORT ?? 4321}.`)
      return `http://localhost:${DEV_SERVER_PORT ?? 4321}`
    default:
      console.log(`The NODE_ENV environment variable is not set, using "production".`)
      return 'https://webstackbuilders.com'
  }
}

// @TODO: We're determining site url and mode (test, dev, prod) all kinds of different ways throughout the code base, using process.env in client code, etc. It's a mess.
// @TODO: Before side-tracking on adding an eslint rule to prohibit process.env except in a few select files, we were trying to fix the src/pages/api files, develop tests for them, and move email templates into a separate system.
// @TODO: Probably should reorganize component code into a 'server' and a 'client' folder instead of just naming files server.ts and client.ts - you can't tell what side supporting files belong to, so doing linting to make sure client code isn't importing server code and vice versa can't be done.
