import { describe, expect, test } from 'vitest'

import accountRoutes from '@/router/account.js'
import catchallRoutes from '@/router/catchall.js'

/**
 * Route characterisation for the account slice.
 *
 * Seams under test: the route table (paths, names, auth flags, mounted
 * components). The refactor moves these definitions into
 * `src/features/account/` without changing URLs. Both the account router and
 * the catch-all define `/no-access`; that duplication is pinned here so the
 * refactor can delete one.
 */

describe('account routes', () => {
  test('it mounts three public routes under /account', () => {
    expect(accountRoutes).toHaveLength(1)

    const [root] = accountRoutes
    expect(root.path).toBe('/account')
    expect(root.props).toMatchObject({ hasSubNav: false })

    const children = root.children
    expect(children.map((child) => child.name).sort()).toEqual(
      ['no-access', 'reset-password', 'reset-password-confirm'].sort(),
    )

    for (const child of children) {
      expect(child.meta).toMatchObject({ needsAuth: false })
    }

    const byName = Object.fromEntries(children.map((child) => [child.name, child]))
    expect(byName['reset-password'].path).toBe('/reset-password')
    expect(byName['reset-password-confirm'].path).toBe('/reset-password-confirm')
    expect(byName['no-access'].path).toBe('/no-access')
  })

  test('every child renders into the app-content outlet', async () => {
    const [root] = accountRoutes

    for (const child of root.children) {
      expect(Object.keys(child.components)).toEqual(['app-content'])
      expect(child.components['app-content']).toBeTruthy()
    }
  })

  test('the catch-all no longer defines its own /no-access', () => {
    const [root] = catchallRoutes
    const names = root.children.map((child) => child.name)

    expect(names).not.toContain('no-access')
  })
})
