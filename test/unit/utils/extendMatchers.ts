import { expect } from "vitest"
import { toBeNil, toBeObject, toHaveInProtoChain } from "../matchers"

/** Add custom matchers */
expect.extend({ toBeNil })
expect.extend({ toBeObject })
expect.extend({ toHaveInProtoChain })
