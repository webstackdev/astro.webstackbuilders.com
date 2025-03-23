/**
 * Run all format tasks
 */
import type { TaskFunction } from 'gulp'
import formatJson from './format:json'
import formatSass from './format:sass'
import formatScript from './format:script'
import { series } from 'gulp'

const task: TaskFunction = series(formatJson, formatSass, formatScript)
export default task
