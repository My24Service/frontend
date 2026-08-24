import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { expect, test } from 'vitest'

/**
 * Recorded goldens, and the rule about what may be asserted against them.
 *
 * A golden is the set of requests a screen put on the wire, captured from a
 * browser session against a development tenant and converted from a HAR. It is
 * not written by hand and it is not read out of the component. That
 * distinction is the whole point of #319 and #320: a golden derived by reading
 * the code cannot disagree with the code, so it certifies whatever the code
 * does — including a dropped query parameter, which is how a customer-facing
 * list lost its pagination with a green suite.
 *
 * One file per screen, scenarios keyed inside it:
 *
 *     tests/unit/golden/member-list.json
 *     { "initial load": [ … ], "page 2": [ … ] }
 *
 * A scenario that has not been recorded yet **skips**, loudly, naming itself in
 * the run output. It does not fall back to an assertion written here. A
 * hand-written stand-in would be a derived golden wearing a recorded golden's
 * name, which is worse than an obvious gap: the gap gets recorded, the
 * stand-in gets believed.
 *
 * See tests/unit/golden/README.md for how to record one.
 */

const GOLDEN_DIR = resolve(process.cwd(), 'tests/unit/golden')

/** Every recorded scenario for a screen, keyed by scenario name. `{}` if none. */
export function goldensFor(screen) {
  try {
    return JSON.parse(readFileSync(resolve(GOLDEN_DIR, `${screen}.json`), 'utf8'))
  } catch {
    return {}
  }
}

/**
 * A test asserting that `requests()` matches the recorded golden for
 * `scenario`, skipped with an explanatory name when nothing has been recorded.
 *
 * `body` drives the screen and returns the requests it made:
 *
 *     goldenTest(goldens, 'initial load', 'member-list', async () => {
 *       await mountList()
 *       return api.requests()
 *     })
 */
export function goldenTest(goldens, scenario, screen, body) {
  const recorded = goldens[scenario]

  if (!recorded) {
    test.skip(`${scenario}: golden not yet recorded — see tests/unit/golden/README.md (${screen})`, () => {})
    return
  }

  test(`${scenario}: puts the recorded set of requests on the wire`, async () => {
    expect(await body()).toEqual(recorded)
  })
}
