import { beforeEach, vi } from 'vitest'

import { client as generatedClient } from '@/api/client.gen'
import legacyClient, { normalClient } from '@/services/api'

import { apiClientMock } from './api-client-mock.js'

const VERBS = ['get', 'post', 'put', 'patch', 'delete']

/**
 * The client fake for a call-shape spec, installed with spies instead of
 * `vi.mock`.
 *
 * Returns the same `fakeHttp` object those specs always used - one `vi.fn()`
 * per verb, driven by `resetFakeHttp` and read by `urlsOf` / `requestShapes`.
 * Before every test the two axios instances in `@/services/api` and the
 * generated SDK's client (`@/api/client.gen`) are spied so that every request
 * made through them lands on it: every holder of those clients - a model
 * singleton, a service a component builds in its own setup - shares the same
 * object, so a spy on its methods reaches them all. setupTests.js restores the
 * real methods before the next test.
 *
 * It replaces `vi.mock('@/services/api')` + `vi.mock('@/api/client.gen')`,
 * which kept a spec out of the shared project (see vitest.config.js) and
 * needed a hoisted fake plus an async factory that could deadlock the run.
 *
 * Prefer the network seam (`support/api-seam/`) for a new spec. This exists
 * for the call-shape specs whose screens still send requests the schema does
 * not declare, which the seam would rightly reject.
 */
export function useFakeHttp() {
  const fakeHttp = Object.fromEntries(VERBS.map((verb) => [verb, vi.fn()]))
  const generated = apiClientMock(fakeHttp).client

  beforeEach(() => {
    for (const axiosInstance of [legacyClient, normalClient]) {
      for (const verb of VERBS) {
        vi.spyOn(axiosInstance, verb).mockImplementation((...args) => fakeHttp[verb](...args))
      }
    }
    for (const verb of ['get', 'post', 'patch', 'delete']) {
      vi.spyOn(generatedClient, verb).mockImplementation(generated[verb])
    }
  })

  return fakeHttp
}
