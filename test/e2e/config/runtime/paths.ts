import path from 'node:path'

const repoRoot = path.resolve(process.cwd())

export const devDatabaseDir = path.join(repoRoot, '.astro')
export const testDatabaseFile = path.join(repoRoot, '.astro', 'content.db')
export const containersEnvFile = path.join(repoRoot, 'test', 'containers', '.env')
export const wiremockComposeFile = path.join(repoRoot, 'test', 'containers', 'docker-compose.e2e.yml')
