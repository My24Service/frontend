import { vi } from 'vitest'

/**
 * Stand a websocket in for the length of a test, through spies on its methods.
 *
 * `target` is what the code under test calls: a socket class's prototype
 * (`MemberNewDataSocket.prototype`, for code that constructs its own) or a
 * singleton instance (`UserSocket`, `MemberSocket`). Every method the app calls
 * is replaced - nothing asks for a room or opens a connection - and `methods`
 * gives the ones a spec records. setupTests.js restores them before the next
 * test.
 *
 * Spies rather than `vi.mock` of the socket module, so the spec can share a
 * worker with the rest of the suite (see the two projects in vitest.config.js).
 */
export function stubSocket(target, methods = {}) {
  const defaults = {
    async init() {},
    setOnmessageHandler() {},
    removeOnmessageHandler() {},
    getSocket() {},
    removeSocket() {},
  }
  for (const [name, implementation] of Object.entries({ ...defaults, ...methods })) {
    vi.spyOn(target, name).mockImplementation(implementation)
  }
}
