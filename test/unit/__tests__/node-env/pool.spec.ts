/**
 * Tests for experimenting with a task runner
 */
import { describe, expect, test } from '@jest/globals'
import { StaticPool } from 'node-worker-threads-pool'
import { WorkerPool, isWorkerPoolInstance } from '../../helpers/workers/pool'

describe(`isWorkerPoolInstance works`, () => {
  test('isWorkerPoolInstance returns true for valid WorkerPool instance', () => {
    const sut = new WorkerPool()
    expect(isWorkerPoolInstance(sut)).toBeTruthy()
  })

  test('isWorkerPoolInstance returns false for invalid input', () => {
    expect(isWorkerPoolInstance(undefined)).toBeFalsy()
    expect(isWorkerPoolInstance({})).toBeFalsy()
  })
})

describe(`getStaticPool and cleanup work`, () => {
  test('returns StaticPool instance', async () => {
    const pool = new WorkerPool()
    const sut = pool.getStaticPool()
    expect(sut instanceof StaticPool).toBeTruthy()
    await pool.cleanup()
  })
})
