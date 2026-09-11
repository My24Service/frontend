import { describe, expect, test } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * The Customer Slice's dependency boundary, as text.
 *
 * Unit 2.5 of the refactoring plan cuts the Slice's leak into the legacy model
 * layer. The leak was indirect: the Slice mounted `@/components/CustomerCard.vue`,
 * whose prop is typed against `CustomerModel` — the Customer Shim in
 * `src/models/customer/` — so the Shim could not die while the Slice still
 * reached it. The Slice has its own card now (`src/features/customer/CustomerCard.vue`),
 * and this spec is the completion criterion written down: a re-import of either
 * the legacy card or the Shim fails here rather than silently re-coupling the
 * two.
 *
 * `@/components/OrdersTable.vue` is NOT covered: it stays a shared legacy
 * component (its consumers span the equipment, company, order and dashboard
 * screens) and the Slice mounts it deliberately. The README's exception ledger
 * records why.
 */

// Same relative-to-cwd resolution vitest.config.js uses for the '@' alias.
const sliceRoot = resolve('./src/features/customer')

function sliceSources(dir = sliceRoot) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return sliceSources(full)
    return /\.(vue|ts)$/.test(entry.name) ? [full] : []
  })
}

/** Every Slice file that matches `pattern`, as paths relative to the Slice root. */
function filesImporting(pattern) {
  return sliceSources()
    .filter((path) => pattern.test(readFileSync(path, 'utf8')))
    .map((path) => path.slice(sliceRoot.length + 1))
}

describe('the Customer Slice boundary', () => {
  test('nothing in the Slice reaches the legacy customer model', () => {
    expect(filesImporting(/from ['"]@\/models\/customer\//)).toEqual([])
  })

  test("nothing in the Slice mounts the legacy @/components/CustomerCard.vue", () => {
    expect(filesImporting(/from ['"]@\/components\/CustomerCard\.vue['"]/)).toEqual([])
  })
})
