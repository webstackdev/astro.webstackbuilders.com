/**
 * Add stats global data keys
 *
 * @returns Keys for timestamp and env
 */
export const getStatsGlobalData = () => {
  return {
    timestamp: Date(),
    env: process.env.ASTRO_ENV,
  }
}
