import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { testDatabaseFile, testCacheDir } from './paths'

const runCommand = (command: string, args: string[], env?: NodeJS.ProcessEnv) => {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: env ?? process.env,
      shell: process.platform === 'win32',
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
      }
    })
  })
}

export const resolveTestDatabaseFile = () => testDatabaseFile

export const prepareDatabase = async () => {
  await mkdir(testCacheDir, { recursive: true })
  const env = {
    ...process.env,
    ASTRO_DATABASE_FILE: testDatabaseFile,
  }
  await runCommand('npx', ['astro', 'db', 'reset', '--force', '--seed'], env)
}
