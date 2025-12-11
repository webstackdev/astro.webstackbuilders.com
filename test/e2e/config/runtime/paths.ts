import path from 'node:path'

const repoRoot = path.resolve(process.cwd())

export const testCacheDir = path.join(repoRoot, '.cache', 'astro-db')
export const testDatabaseFile = path.join(testCacheDir, 'e2e.db')
export const containersEnvFile = path.join(repoRoot, 'test', 'containers', '.env')
export const wiremockComposeFile = path.join(repoRoot, 'test', 'containers', 'docker-compose.e2e.yml')
