import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ContractForm, ModulePartList } from '@/features/member'
import { vPaginatedModulePartList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { moduleData } from '../../fixtures/member-demo-tenant.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { createTestQueryClient, mountForm } from '../../support/form-harness.js'
import { mountList, openDelete } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { memberRoutes } from '../../support/member-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The Module write to Contract form edge of the cross-resource invalidation
 * decision (#323).
 *
 * The Contract form's checkbox tree is built from `GET /api/member/get-module-data/`,
 * a read model the Module and Module Part screens write. The rule settled in
 * #323 is that the *writer* invalidates what its change makes stale — so a
 * part deleted on the Part list must re-fetch this tree for any consumer
 * holding it, including one inside vue-query's stale window. This spec pins
 * exactly that round trip through the seam: the re-fetch happens while the
 * Contract form's query is still live.
 */

const api = installApiSeam()

const PART_ITEM = itemSchemaOf(vPaginatedModulePartList)

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
})

async function mountContractForm(queryClient) {
  const wrapper = mountForm(ContractForm, {deep: true, routes: memberRoutes, queryClient})
  await settle()
  return wrapper
}

test('deleting a module part re-fetches the tree the Contract form is displaying', async () => {
  // One client across both mounts: in the application there is a single
  // cache, and the whole point is that an invalidation on one screen reaches
  // a consumer mounted on another.
  const queryClient = createTestQueryClient()

  // The Contract form reads the tree; within 30 seconds a cached answer would
  // otherwise hide the deletion from its checkboxes.
  const contractForm = await mountContractForm(queryClient)
  expect(api.requests().filter((sent) => sent.path === '/api/member/get-module-data/')).toHaveLength(1)

  // A part is deleted on its own screen.
  const partList = await mountList(ModulePartList, {queryClient})
  await openDelete(partList)
  modal('delete-module-part-modal').ok()

  // The invalidation reaches the live consumer: the tree is asked for again,
  // and would now show the part gone.
  await settle()
  const treeRequests = api.requests().filter((sent) => sent.path === '/api/member/get-module-data/')
  expect(treeRequests).toHaveLength(2)
  expect(contractForm.find('.b-overlay').exists()).toBe(false)
})
