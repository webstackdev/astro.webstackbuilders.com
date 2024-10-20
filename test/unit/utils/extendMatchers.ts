import { expect } from '@jest/globals'
import { toBeNil, toBeObject, toHaveInProtoChain } from '../matchers'

/** Add custom Jest matchers */
expect.extend({ toBeNil })
expect.extend({ toBeObject })
expect.extend({ toHaveInProtoChain })
