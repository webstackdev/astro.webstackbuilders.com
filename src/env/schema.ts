// @ts-check
import { z } from 'zod'

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
})

/**
 * You can't destruct `process.env` as a regular object in the Next.js
 * middleware, so you have to do it manually here.
 */
type ServerEnv = { [k in keyof z.input<typeof serverSchema>]: string | undefined }
export const serverEnv: ServerEnv = {
  NODE_ENV: process.env.NODE_ENV,
}

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const clientSchema = z.object({
  PUBLIC_URL: z.string().url(),
})

/**
 * You can't destruct `process.env` as a regular object, so you have to do it manually here.
 */
type ClientEnv = { [k in keyof z.input<typeof clientSchema>]: string | undefined }
export const clientEnv: ClientEnv = {
  PUBLIC_URL: process.env.PUBLIC_URL,
}
