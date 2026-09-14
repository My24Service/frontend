import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ContractForm, ContractList, MemberForm } from '@/features/member'
import { vContract, vPaginatedContractList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { moduleData } from '../../fixtures/member-demo-tenant.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'
import { mountList, openDelete } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { memberRoutes } from '../../support/member-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const CONTRACT_ITEM = itemSchemaOf(vPaginatedContractList)

function contractRows() {
  return [
    fixtureFor(CONTRACT_ITEM, {id: 6, name: 'Advanced+'}),
    fixtureFor(CONTRACT_ITEM, {id: 28, name: 'My24Service Normal'}),
  ]
}

beforeEach(() => {
  api.get('/api/member/get-module-data/', moduleData)
  api.get('/api/member/companycode-exists/', {available: true})
})

async function mountSliceMemberForm() {
  const wrapper = mountForm(MemberForm, {
    deep: true,
    routes: memberRoutes,
    main: {getCountries: [{value: 'NL', text: 'Nederland'}]},
  })
  await settle()
  return wrapper
}

function offeredContracts(wrapper) {
  return wrapper.findAll('option').map((option) => option.text())
}

test('a contract created on the new form is offered on the Member form', async () => {
  api.get('/api/member/contract/', paginated(contractRows(), {count: 9}))
  api.post('/api/member/contract/', fixtureFor(vContract, {id: 40, name: 'brand-new'}))

  const form = mountForm(ContractForm, {deep: true, routes: memberRoutes})
  await settle()

  await form.get('#contract_name').setValue('brand-new')
  await form.get('#el292').setValue(true)
  await form.get('.modal-footer .btn-primary').trigger('click')
  await settle()

  expect(api.requests().filter((sent) => sent.method === 'post')).toHaveLength(1)

  api.get('/api/member/contract/', paginated(
    [...contractRows(), fixtureFor(CONTRACT_ITEM, {id: 40, name: 'brand-new'})],
    {count: 9},
  ))

  const memberForm = await mountSliceMemberForm()

  expect(offeredContracts(memberForm)).toContain('brand-new')
})

test('a contract deleted on the new list stops being offered on the Member form', async () => {
  api.get('/api/member/contract/', paginated(contractRows(), {count: 9}))
  api.delete('/api/member/contract/{id}/', noContent)

  const list = await mountList(ContractList)
  await openDelete(list)

  api.get('/api/member/contract/', paginated(
    contractRows().filter((row) => row.id !== 34),
    {count: 9},
  ))

  modal('delete-contract-modal').ok()
  await settle()

  expect(api.requests().filter((sent) => sent.method === 'delete')).toHaveLength(1)

  const memberForm = await mountSliceMemberForm()

  expect(offeredContracts(memberForm)).not.toContain('Basic')
})
