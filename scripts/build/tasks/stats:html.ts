/**
 * Show performance measurements for all output entries
 * and not just those that take longer than 8%.
 */
import task from './build:html'

process.env['DEBUG'] = `Eleventy:Benchmark*`
export default task
