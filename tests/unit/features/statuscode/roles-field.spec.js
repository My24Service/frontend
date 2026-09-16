import { beforeEach, describe, expect, test, vi } from 'vitest'

import RolesField from '@/features/statuscode/statuscode/RolesField.vue'
import { roleLabel } from '@/features/statuscode/statuscode/roles'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'
import { statuscodeRoutes } from '../../support/statuscode-routes.js'

/**
 * The roles field: one checkbox per settings key the API offers for the
 * type, labelled from the key name, bound to the form's `roles` list.
 */

const api = installApiSeam()

const ROLES = ['order_change_status', 'order_entry_status']

beforeEach(() => {
  api.get('/api/statuscode/statuscode/roles/', ROLES)
})

async function mountRolesField(props = {}) {
  const wrapper = mountForm(RolesField, {
    deep: true,
    routes: statuscodeRoutes,
    props: { codeType: 'order', modelValue: [], ...props },
  })
  await settle()
  return wrapper
}

describe('roleLabel', () => {
  test('makes a key readable', () => {
    expect(roleLabel('order_entry_branch_status')).toBe('Order entry branch status')
  })
})

describe('RolesField', () => {
  test('asks the API for the type’s roles and offers one checkbox per key', async () => {
    const wrapper = await mountRolesField({ codeType: 'order' })

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/statuscode/statuscode/roles/', query: { code_type: 'order' } },
    ])
    expect(wrapper.findAll('input[type="checkbox"]').map((box) => box.attributes('value'))).toEqual(ROLES)
    expect(wrapper.text()).toContain('Order entry status')
  })

  test('shows the record’s roles as checked and emits the new list on a click', async () => {
    const onUpdate = vi.fn()
    const wrapper = await mountRolesField({ modelValue: ['order_entry_status'], 'onUpdate:modelValue': onUpdate })

    expect(wrapper.get('#statuscode_role_order_entry_status').element.checked).toBe(true)
    expect(wrapper.get('#statuscode_role_order_change_status').element.checked).toBe(false)

    await wrapper.get('#statuscode_role_order_change_status').setValue(true)

    expect(onUpdate).toHaveBeenCalled()
    expect([...onUpdate.mock.calls.at(-1)[0]].sort()).toEqual(['order_change_status', 'order_entry_status'])
  })

  test('keeps a role the record carries that the API no longer offers', async () => {
    const wrapper = await mountRolesField({ modelValue: ['order_old_status'] })

    expect(wrapper.get('#statuscode_role_order_old_status').element.checked).toBe(true)
  })

  test('shows the server’s refusal', async () => {
    const wrapper = await mountRolesField({ error: 'Role already used by another status: x (y)' })

    expect(wrapper.text()).toContain('Role already used by another status')
  })
})
