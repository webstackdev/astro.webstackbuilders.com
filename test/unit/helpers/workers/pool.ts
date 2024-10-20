/**
 * Provide a worker pool for tasks that are ran inside a Jest JSDOM environment
 * but need an isolated Node environment, like Webpack and programmatic Eleventy
 */
import { resolve } from 'path'
import { StaticPool } from 'node-worker-threads-pool'

export type OrchestratorType = 'tsCompile' | 'loadHtmlTemplate'
export type OrchestratorParamType<T> = {
  helperType: T
  inputPath: string
}
export type OrchestratorReturnType<T> = T extends 'tsCompile'
  ? Promise<string>
  : T extends 'loadHtmlTemplate'
  ? Promise<string>
  : /** Throw type error if new OrchestratorType added and return case not updated */
    never
export type OrchestratorFn = <T extends OrchestratorType>({
  helperType,
  inputPath
}: OrchestratorParamType<T>) => OrchestratorReturnType<T>

export function isWorkerPoolInstance(input: unknown): input is WorkerPool {
  const isDefined = !!input
  const isInstanceOf = input instanceof WorkerPool
  if (isDefined && isInstanceOf) return true
  return false
}

export const getWorkerPool = (): WorkerPool => {
  const state = globalThis.WORKER_POOL
  if (!isWorkerPoolInstance(state)) {
    throw new Error(`Global worker pool not a valid instance of WorkerPool`)
  }
  return state
}

export class WorkerPool {
  private staticPool: StaticPool<OrchestratorFn> | undefined
  public instanceToken: boolean

  constructor() {
    /** Always last */
    this.instanceToken = true
  }

  /** Enable instanceof checks across realms and into Jest's VM for object instances */
  static [Symbol.hasInstance](instance: unknown) {
    return (
      instance &&
      typeof instance === 'object' &&
      (instance as WorkerPool)['instanceToken' as keyof WorkerPool]
    )
  }

  getStaticPool(): StaticPool<OrchestratorFn> {
    /** Only initialize if the pool is actually called in a test */
    if (!this.staticPool)
      this.staticPool = new StaticPool({
        size: 1,
        task: resolve('./test/jest/helpers/workers/orchestrator.js'),
      })
    return this.staticPool
  }

  async cleanup() {
    if (this.staticPool) await this.staticPool.destroy()
  }
}
