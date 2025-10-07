/**
 * Run all format tasks
 */
import type { TaskFunction } from 'gulp'
import formatJson from './format:json.ts'
import formatSass from './format:sass.ts'
import { series } from 'gulp'

const task: TaskFunction = series(formatJson, formatSass)
export default task
