import { vi } from "vitest"

const originalPoolModule = await vi.importActual<typeof import('../pool')>('../pool')

export const { isWorkerPoolInstance, WorkerPool } = originalPoolModule

let poolInstance: typeof WorkerPool

export const getWorkerPool = () => {
  if (!poolInstance) {
    poolInstance = new WorkerPool() as unknown as typeof WorkerPool
  }
  return poolInstance
}
