import { createReadStream, existsSync } from 'node:fs'
import path from 'node:path'
import type { PluginOption } from 'vite'

const devDistDirectory = path.resolve(process.cwd(), 'dev-dist')

const matchesWorkboxAsset = (urlPath: string): string | null => {
  const match = urlPath.match(/^\/(workbox-[\w-]+\.js(?:\.map)?)(?:\?dev-sw)?$/)
  return match?.[1] ?? null
}

export const pwaDevAssetServer = (): PluginOption => ({
  name: 'pwa-dev-asset-server',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url) {
        next()
        return
      }

      const assetName = matchesWorkboxAsset(req.url)
      if (!assetName) {
        next()
        return
      }

      const assetPath = path.join(devDistDirectory, assetName)
      if (!existsSync(assetPath)) {
        next()
        return
      }

      if (assetName.endsWith('.map')) {
        res.setHeader('Content-Type', 'application/json')
      } else {
        res.setHeader('Content-Type', 'application/javascript')
      }

      createReadStream(assetPath)
        .on('error', () => {
          next()
        })
        .pipe(res)
    })
  },
})
