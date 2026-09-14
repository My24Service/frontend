import { appendFileSync } from 'node:fs'
import { beforeAll, expect } from 'vitest'

// Per-file import tax. Loaded only by `npm run test:profile`; the default run
// never sees this file (see vitest.config.js).
//
// It is listed FIRST in setupFiles, so this module evaluates before the rest of
// the setup chain and before the spec's own module graph. The beforeAll below
// fires once all of that has evaluated, so the gap between the two is what the
// spec cost to import. That number is invisible in the normal reporters: vitest
// attributes a file's whole duration to its test bodies, which is why a spec
// can report "3ms" while spending seconds in its import graph first.
const T0 = performance.now()

beforeAll(() => {
  const file = process.env.VITEST_IMPORT_TAX_FILE
  if (!file) return

  let path = 'unknown'
  try {
    path = expect.getState().testPath ?? 'unknown'
  } catch {
    // No testPath on this vitest build; keep the measurement, lose the label.
  }

  appendFileSync(file, JSON.stringify({ path, ms: performance.now() - T0 }) + '\n')
})
