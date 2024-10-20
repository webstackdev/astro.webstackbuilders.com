/** Add type for event listener functions passed in an array to globalThis */
declare function ScriptInit(): void

/** Add type for function operating on add event listener to globalThis */
declare function ScriptInitFn(scripts: ScriptInit[]): void

/** Add properties to the client-side Windows object */
interface Window {
  /**
   * Object with theme id's as keys and backgroundOffset hex color as value.
   * This is set in initialTheme.njk from themes.json in _data directory.
   * Used to sets the color of the surrounding user interface for e.g. the
   * browser title bar. It is updated by script when the theme changes.
   */
  metaColors: Record<string, string>;
}
