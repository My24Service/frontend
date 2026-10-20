/**
 * How long the app lets input come to rest before acting on it.
 *
 * One object rather than a literal per call site so the unit suite can set
 * every delay to zero (tests/unit/setupTests.js): specs used to sleep through
 * the real ones, which was about a quarter of the suite's test time. A spec
 * that asserts a delay itself puts the real value back for that test.
 *
 * Call sites pass the getters below, never the number: VueUse reads a getter
 * each time the debounce fires, so a value changed after mounting still
 * applies. Nothing in the application writes to this object.
 */
export const inputDelays = {
  /** Search boxes, autocompletes and the username / company-code probes. */
  typingMs: 500,
  /** A list's search and column filters, before they reach the query and URL. */
  tableFilterMs: 300,
  /** The select filter editor's option search. */
  optionSearchMs: 250,
}

/** The production values, for a spec that asserts one. */
export const DEFAULT_INPUT_DELAYS = Object.freeze({ ...inputDelays })

export const typingDelay = () => inputDelays.typingMs
export const tableFilterDelay = () => inputDelays.tableFilterMs
export const optionSearchDelay = () => inputDelays.optionSearchMs
