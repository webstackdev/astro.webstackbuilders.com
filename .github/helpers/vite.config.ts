import { defineConfig } from 'vite'
import { existsSync } from 'fs'
import { resolve } from 'path'

const getRequiredEnv = (name: string): string => {
  const value = (process.env[name] ?? '').trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export default defineConfig(() => {
  const actionDir = resolve(getRequiredEnv('ACTION_DIR'))
  const entryFile = resolve(actionDir, 'src/index.ts')

  if (!existsSync(entryFile)) {
    throw new Error(`Missing action entrypoint: ${entryFile}`)
  }

  return {
    root: actionDir,
    ssr: {
      target: 'node',
      noExternal: true,
    },
    build: {
      outDir: resolve(actionDir, 'dist'),
      emptyOutDir: true,
      sourcemap: false,
      minify: false,
      target: 'node20',
      rollupOptions: {
        output: {
          format: 'es',
          entryFileNames: 'index.mjs',
          chunkFileNames: 'chunks/[name]-[hash].mjs',
          inlineDynamicImports: true,
        },
      },
      ssr: entryFile,
    },
  }
})
