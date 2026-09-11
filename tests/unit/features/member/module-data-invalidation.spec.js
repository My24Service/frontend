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
