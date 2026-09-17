import { describe, expect, test } from 'vitest'
import { EQUIPMENT_TYPES } from '@/constants'
import companyRoutes from '@/router/company'
import customerRoutes from '@/router/customer'
import equipmentRoutes from '@/router/equipment'
import settingsRoutes from '@/router/settings'

/**
 * Every route name the equipment Slice's screens can link to has to exist.
 *
 * The screens build some of their names from a `route_prefix` prop and the
 * member's own shape - the equipment list links a row to `<prefix>-view-<type>`
 * when the member has branches and `<prefix>-view` otherwise - so a name can be
 * emitted that no router ever registered. Nothing fails when that happens:
 * `<router-link>` logs "No match" and the link goes nowhere, and the frontend's
 * **typecheck cannot see it**, because the routers are `.js` and tsconfig sets
 * `checkJs: false` - a constant that was never imported passes `vue-tsc` and only
 * throws when the module is evaluated.
 *
 * So this file does three things the other gates do not: it imports all three
 * routers (which evaluates them), it collects every name they register, and it
 * asserts the set of names the screens can emit is inside it.
 *
 * Three mounts render these screens - the equipment router, the customer router
 * and the settings layout - and each has its own name family, so the contract is
 * per prefix rather than global.
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

// The company router too: the rows link a branch out to `company-branch-view`,
// which is that router's, and a name is only real if some router registers it.
const registered = namesIn([equipmentRoutes, customerRoutes, settingsRoutes, companyRoutes])
const TYPES = Object.values(EQUIPMENT_TYPES)

/** The equipment mounts. Their screens emit typed and untyped names alike. */
const EQUIPMENT_PREFIXES = [
  'equipment-equipment',
  'customers-equipment',
  'settings-equipment',
]

/** The location mounts: plain list/view/edit/add, and a sibling equipment link. */
const LOCATION_PREFIXES = [
  'equipment-location',
  'customers-location',
  'settings-location',
]

const emitted = [
  ...EQUIPMENT_PREFIXES.flatMap((prefix) => [
    `${prefix}-list`,
    `${prefix}-add`,
    `${prefix}-edit`,
    `${prefix}-view`,
    ...TYPES.flatMap((type) => [
      `${prefix}-view-${type}`,
      `${prefix}-edit-${type}`,
    ]),
  ]),
  ...LOCATION_PREFIXES.flatMap((prefix) => [
    `${prefix}-list`,
    `${prefix}-add`,
    `${prefix}-edit`,
    `${prefix}-view`,
  ]),
  // The location detail page's equipment table links to the sibling equipment
  // view, by swapping 'location' for 'equipment' in its own prefix.
  ...LOCATION_PREFIXES.map((prefix) => `${prefix.replace('location', 'equipment')}-view`),
  // The buildings have one mount, so one family.
  'equipment-building-list',
  'equipment-building-add',
  'equipment-building-edit',
  'equipment-building-view',
  // What the rows link out to.
  'customer-view',
  'company-branch-view',
]

describe('the equipment Slice can reach every route name it emits', () => {
  test.each(emitted)('%s is registered', (name) => {
    expect(registered.has(name), 'no router registers ' + name).toBe(true)
  })

  test('the routers are evaluated, not merely imported', () => {
    // A guard on this file's own premise: an unimported constant in a .js
    // router throws when the module is evaluated, which is how that bug
    // surfaced. If a router stopped exporting records, the per-name
    // assertions would fail for the wrong reason; this says which.
    expect(registered.size).toBeGreaterThan(20)
  })
})
