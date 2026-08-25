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
 * Some scenarios cannot be captured against the tenant as it stands — a list
 * with less than one page of rows has no pagination control to click. Those are
 * listed in `golden/blocked.json` with a reason, and skip *saying* the reason.
 * The distinction is the point: an unexplained skip is how an unmet ticket
 * comes to look finished, and these two look identical in a run summary unless
 * one of them says why. Recording always wins — if a golden for a blocked
 * scenario appears, the spec runs.
 *
 * See tests/unit/golden/README.md for how to record one.
 */

const GOLDEN_DIR = resolve(process.cwd(), 'tests/unit/golden')

/** Scenarios that cannot be captured yet, by screen, with the reason for each. */
function blockedReasons() {
  try {
    return JSON.parse(readFileSync(resolve(GOLDEN_DIR, 'blocked.json'), 'utf8'))
  } catch {
    return {}
  }
}

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
 *
 * An optional `normalize` runs over **both** sides before comparison, for
 * declared deltas that are spelling rather than substance — #324's boolean
 * casing, where the generated client sends real booleans and the recording
 * holds Django-style strings. The recordings themselves stay untouched;
 * normalising only the comparison keeps them authoritative.
 */
export function goldenTest(goldens, scenario, screen, body, normalize = null) {
  const recorded = goldens[scenario]

  if (!recorded) {
    // The body is left in place rather than deleted. A blocked scenario is
    // blocked by the tenant's data, not by anything about the screen, so the
    // moment a capture becomes possible this runs without anyone rewriting how
    // it drives the DOM.
    const blocked = blockedReasons()[screen]?.[scenario]

    test.skip(
      blocked
        ? `${scenario}: not recordable against the tenant — ${blocked} (${screen})`
        : `${scenario}: golden not yet recorded — see tests/unit/golden/README.md (${screen})`,
      () => {},
    )
    return
  }

  test(`${scenario}: puts the recorded set of requests on the wire`, async () => {
    const sent = await body()

    if (normalize) {
      expect(normalize(sent)).toEqual(normalize(recorded))
    } else {
      expect(sent).toEqual(recorded)
    }
  })
}
