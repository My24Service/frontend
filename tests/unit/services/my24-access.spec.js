import { describe, expect, test } from 'vitest'

import my24 from '@/services/my24'

// A member contract as produced by getModelsFromString: module -> allowed parts.
const contract = {
  orders: ['list', 'form', 'view'],
  inventory: ['list', 'form'],
  mobile: ['list'],
}

function config(overrides = {}) {
  return {
    contract,
    module: 'orders',
    part: 'list',
    lenParts: 2,
    isStaff: false,
    isSuperuser: false,
    ...overrides,
  }
}

describe('my24.hasAccessToModule', () => {
  test('superusers are allowed everywhere', () => {
    expect(my24.hasAccessToModule(config({
      isSuperuser: true,
      module: 'nonexistent',
      part: 'nonexistent',
    }))).toBe(true)
  })

  test('single-part routes are always allowed', () => {
    // e.g. "/" and "/no-access"
    expect(my24.hasAccessToModule(config({
      lenParts: 1,
      module: 'no-access',
      part: undefined,
    }))).toBe(true)
  })

  test('staff may reach the members module even without a contract entry', () => {
    expect(my24.hasAccessToModule(config({
      isStaff: true,
      module: 'members',
      part: 'list',
    }))).toBe(true)
  })

  test('non-staff may not reach the members module', () => {
    expect(my24.hasAccessToModule(config({
      module: 'members',
      part: 'list',
    }))).toBe(false)
  })

  test.each(['dashboard', 'settings'])('the %s module is always allowed', (module) => {
    expect(my24.hasAccessToModule(config({ module, part: 'anything' }))).toBe(true)
  })

  test.each([
    'form', 'view', 'info', 'company', 'activity', 'pictures',
    'planning-users', 'employee-users', 'import', 'statuscodes',
    'api-users', 'map', 'filter', 'schedule',
  ])('part "%s" is allowed regardless of the contract', (part) => {
    // 'mobile' only has 'list' in the contract above.
    expect(my24.hasAccessToModule(config({ module: 'mobile', part }))).toBe(true)
  })

  test.each([
    'members', 'contracts', 'deleted-members', 'modules', 'module-parts', 'settings',
  ])('staff may reach the "%s" part', (part) => {
    expect(my24.hasAccessToModule(config({
      isStaff: true,
      module: 'mobile',
      part,
    }))).toBe(true)
  })

  test('a staff-only part is denied for non-staff', () => {
    expect(my24.hasAccessToModule(config({
      module: 'mobile',
      part: 'contracts',
    }))).toBe(false)
  })

  test('a module missing from the contract is denied', () => {
    expect(my24.hasAccessToModule(config({
      module: 'quotations',
      part: 'list',
    }))).toBe(false)
  })

  test('a module in the contract with no part is allowed', () => {
    expect(my24.hasAccessToModule(config({
      module: 'orders',
      part: undefined,
    }))).toBe(true)
  })

  test('a part listed in the contract is allowed', () => {
    expect(my24.hasAccessToModule(config({
      module: 'inventory',
      part: 'form',
    }))).toBe(true)
  })

  test('a part not listed in the contract is denied', () => {
    // 'list' is not an always-allowed part, and inventory's contract lacks it.
    expect(my24.hasAccessToModule(config({
      module: 'mobile',
      part: 'stats',
    }))).toBe(false)
  })
})

describe('my24.getModelsFromString', () => {
  test('parses a module:parts|module:parts contract string', () => {
    expect(my24.getModelsFromString('orders:list,form|mobile:list')).toEqual({
      orders: ['list', 'form'],
      mobile: ['list'],
    })
  })

  test('parses a single module', () => {
    expect(my24.getModelsFromString('orders:list')).toEqual({ orders: ['list'] })
  })
})

describe('my24.isAllowed', () => {
  test('planning users are allowed', () => {
    expect(my24.isAllowed({
      user: { planning_user: true, is_staff: false, is_superuser: false },
    })).toBe(true)
  })

  test('staff and superusers are allowed', () => {
    expect(my24.isAllowed({
      user: { planning_user: false, is_staff: true, is_superuser: false },
    })).toBe(true)
    expect(my24.isAllowed({
      user: { planning_user: false, is_staff: false, is_superuser: true },
    })).toBe(true)
  })

  test('plain users are not allowed', () => {
    expect(my24.isAllowed({
      user: { planning_user: false, is_staff: false, is_superuser: false },
    })).toBe(false)
  })
})

describe('my24.getParameterByName', () => {
  test('reads a query parameter from an explicit url', () => {
    expect(my24.getParameterByName('next', 'http://x/?next=/orders/list')).toBe('/orders/list')
  })

  test('decodes + as a space', () => {
    expect(my24.getParameterByName('q', 'http://x/?q=foo+bar')).toBe('foo bar')
  })

  test('returns null when the parameter is absent', () => {
    expect(my24.getParameterByName('nope', 'http://x/?q=1')).toBeNull()
  })

  test('returns an empty string for a valueless parameter', () => {
    expect(my24.getParameterByName('flag', 'http://x/?flag')).toBe('')
  })
})
