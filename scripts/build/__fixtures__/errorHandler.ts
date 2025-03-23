import type { GulpError } from '../utils'
import { handleError } from '../utils'

const testErr = new Error(`something happened`) as unknown as GulpError
handleError(testErr)
