import { BuildError } from '@lib/errors'

const errorMessage =
  'fsevents is not available in this environment. This shim forces Rollup to fall back to non-native file watching.'

const error = new BuildError({ message: errorMessage })
error.name = 'FseventsUnavailableError'

throw error

export {}
