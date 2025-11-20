/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly NODE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
