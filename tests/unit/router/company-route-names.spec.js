import { describe, expect, test } from 'vitest'
import companyRoutes from '@/router/company'
import equipmentRoutes from '@/router/equipment'
import settingsRoutes from '@/router/settings'

/**
 * Every route name the company Slice's screens can link to has to exist.
 *
 * A name a screen emits that no router registers fails silently:
 * `<router-link>` logs "No match" and the link goes nowhere, and the
 * frontend's **typecheck cannot see it**, because the routers are `.js` and
 * tsconfig sets `checkJs: false` - a constant that was never imported passes
 * `vue-tsc` and only throws when the module is evaluated.
 *
 * So this file does three things the other gates do not: it imports the
 * routers (which evaluates them), it collects every name they register, and
 * it asserts the set of names the screens can emit is inside it. Copied from
 * `tests/unit/router/equipment-route-names.spec.js`; extended with every
 * prefix the company Slice migrates. The dual-mounted screens (branches,
 * imports) emit one family per mount, so both families are listed.
 */

/** Every named route record in a router's tree, including nested children. */
function namesIn(routes, found = new Set()) {
  for (const route of routes) {
    const records = Array.isArray(route) ? route : [route]
    for (const record of records) {
      if (record?.name) found.add(record.name)
      if (record?.children) namesIn(record.children, found)
    }
  }
  return found
}

const registered = namesIn([companyRoutes, settingsRoutes, equipmentRoutes])

/** The picture screens have one mount, so one name family. The activity list
 * is a lone screen with no form routes. */
const BRANCH_PREFIXES = [
  'company-branch',
  'settings-branch',
]

const emitted = [
  'company-pictures',
  'company-picture-add',
  'company-picture-edit',
  'company-activity',
  // Both branch mounts emit the same five names under their own stem; the
  // screens switch families on `from_settings`, which the layouts supply.
  ...BRANCH_PREFIXES.flatMap((prefix) => [
    `${prefix}-add`,
    `${prefix}-edit`,
    `${prefix}-view`,
  ]),
  'company-branches',
  'company-my-branch',
  'settings-branches',
  'settings-my-branch',
  // The budget list links each year to the detail view.
  'company-budgets',
  'company-budget-view',
  // The branch detail page's equipment and location tables link to the
  // equipment screens by their own names, not the branch stem.
  'equipment-equipment-add',
  'equipment-equipment-edit',
  'equipment-equipment-list',
  'equipment-location-add',
  'equipment-location-edit',
  'equipment-location-list',
]

describe('the company Slice can reach every route name it emits', () => {
  test.each(emitted)('%s is registered', (name) => {
    expect(registered.has(name), 'no router registers ' + name).toBe(true)
  })

  test('the routers are evaluated, not merely imported', () => {
    expect(registered.size).toBeGreaterThan(20)
  })
})
