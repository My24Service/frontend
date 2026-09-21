import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ContractForm, ContractList, MemberList, ModuleForm, ModulePartForm, ModulePartList } from '@/features/member'
import { invalidateModuleListQueries } from '@/features/member'
import {
  vModule,
  vModulePart,
  vPaginatedContractList,
  vPaginatedMemberList,
  vPaginatedModulePartList,
} from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { moduleData, moduleList, modulePart254 } from '../../fixtures/member-demo-tenant.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { createTestQueryClient, mountForm } from '../../support/form-harness.js'
import { mountList, openDelete } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { memberRoutes } from '../../support/member-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const PART_ITEM = itemSchemaOf(vPaginatedModulePartList)
const MEMBER_ITEM = itemSchemaOf(vPaginatedMemberList)
const CONTRACT_ITEM = itemSchemaOf(vPaginatedContractList)

const SUPERUSER = {auth: {isSuperuser: true}}

const MODULE = fixtureFor(vModule, {id: 2, name: 'orders'})
const PART_DETAIL = fixtureFor(vModulePart, modulePart254)

function partPage(parts = [{name: 'sent', module_name: 'invoices'}]) {
  return paginated(
    parts.map((part, index) => fixtureFor(PART_ITEM, {id: index + 301, ...part})),
    {count: 45},
  )
}

beforeEach(() => {
  api.get('/api/member/get-module-data/', moduleData)
  api.get('/api/member/module-part/', partPage())
  api.delete('/api/member/module-part/{id}/', noContent)
  api.get('/api/member/member/', paginated([
    fixtureFor(MEMBER_ITEM, {id: 39, name: 'Acme BV', contract_text: 'Service contract 2026'}),
  ], {count: 1}))
  api.get('/api/member/contract/', paginated([
    fixtureFor(CONTRACT_ITEM, {id: 7, name: 'Support', modules_text: 'Cleaning, Inspection'}),
  ], {count: 1}))
  api.get('/api/member/module/', moduleList)
  api.get('/api/member/module/{id}/', MODULE)
  api.patch('/api/member/module/{id}/', MODULE)
  api.get('/api/member/module-part/{id}/', PART_DETAIL)
  api.patch('/api/member/module-part/{id}/', PART_DETAIL)
})

async function mountContractForm(queryClient) {
  const wrapper = mountForm(ContractForm, {deep: true, routes: memberRoutes, queryClient})
  await settle()
  return wrapper
}

test('deleting a module part re-fetches the tree the Contract form is displaying', async () => {
  const queryClient = createTestQueryClient()

  const contractForm = await mountContractForm(queryClient)
  expect(api.requests().filter((sent) => sent.path === '/api/member/get-module-data/')).toHaveLength(1)

  const partList = await mountList(ModulePartList, {queryClient})
  await openDelete(partList)
  modal('delete-module-part-modal').ok()

  await settle()
  const treeRequests = api.requests().filter((sent) => sent.path === '/api/member/get-module-data/')
  expect(treeRequests).toHaveLength(2)
  expect(contractForm.find('.b-overlay').exists()).toBe(false)
})

/**
 * The two list screens render columns the Module resource owns. MemberList's
 * `contract_text` is the serializer's `get_contract_text` and ContractList's
 * `modules_text` is `get_modules_text` — both computed in Python from the
 * module rows, and neither list has a module column of its own to notice a
 * rename. A module write that leaves them cached shows the old text for as long
 * as the user leaves the screen open, which is the same cross-resource
 * staleness #323 is about, one edge further out: a contract write refreshes the
 * member form's dropdown, so a module write has to refresh the two lists that
 * display what the modules mean.
 */
describe('a module write and the lists that render the derived columns', () => {
  test('renaming a module re-fetches the member and the contract list', async () => {
    const queryClient = createTestQueryClient()

    await mountList(MemberList, {...SUPERUSER, queryClient})
    await mountList(ContractList, {...SUPERUSER, queryClient})

    const loads = (path) => api.requests().filter((sent) => sent.path === path).length
    expect([loads('/api/member/member/'), loads('/api/member/contract/')]).toEqual([1, 1])

    const moduleForm = mountForm(ModuleForm, {deep: true, routes: memberRoutes, props: {pk: 2}, queryClient})
    await settle()

    const name = moduleForm.get('#module_name')
    await name.setValue('orders renamed')
    await name.trigger('change')
    await moduleForm.get('.modal-footer .btn-primary').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'patch')).toHaveLength(1)
    expect([loads('/api/member/member/'), loads('/api/member/contract/')]).toEqual([2, 2])
  })

  test('renaming a module part re-fetches the member and the contract list', async () => {
    const queryClient = createTestQueryClient()

    await mountList(MemberList, {...SUPERUSER, queryClient})
    await mountList(ContractList, {...SUPERUSER, queryClient})

    const loads = (path) => api.requests().filter((sent) => sent.path === path).length
    expect([loads('/api/member/member/'), loads('/api/member/contract/')]).toEqual([1, 1])

    const partForm = mountForm(ModulePartForm, {deep: true, routes: memberRoutes, props: {pk: 254}, queryClient})
    await settle()

    const name = partForm.get('#module-part_name')
    await name.setValue('cleaning renamed')
    await name.trigger('change')
    await partForm.get('.modal-footer .btn-primary').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'patch')).toHaveLength(1)
    expect([loads('/api/member/member/'), loads('/api/member/contract/')]).toEqual([2, 2])
  })
})

/**
 * The four reads a module write makes stale are independent, so they are issued
 * together. Awaiting each in turn would still pass every spec above — the same
 * requests come back, just later — so this is the one claim the request counts
 * cannot make: with a client that never settles, a sequential implementation
 * issues the first invalidation and stops, while a `Promise.all` has issued all
 * of them before any resolves.
 */
describe('the module invalidation issues its independent refreshes together', () => {
  test('all four keys are invalidated before any of them resolves', async () => {
    const queryClient = createTestQueryClient()
    const issued = []
    vi.spyOn(queryClient, 'invalidateQueries').mockImplementation((filters) => {
      issued.push(filters.queryKey[0]._id)
      return new Promise(() => {})
    })

    // Deliberately not awaited: every invalidation hangs, which is the point.
    invalidateModuleListQueries(queryClient)
    await Promise.resolve()

    expect(issued).toEqual([
      'memberModuleList',
      'memberGetModuleDataList',
      'memberMemberList',
      'memberContractList',
    ])
  })
})
