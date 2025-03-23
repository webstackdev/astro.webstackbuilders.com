/**
 * Identity filter for use in tests
 *
 * Usage:
 *   {{ `test` | identity }}
 *
 * @param _
 * @param input
 */
exports.identity = (_, input) => {
  return input
}
