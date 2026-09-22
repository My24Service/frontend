import { beforeEach, describe, expect, test } from 'vitest'
import { defineComponent, ref } from 'vue'

import { useDocumentCollection } from '@/features/documents'
import { customerDocumentResource } from '@/features/customer'
import { vPaginatedCustomerDocumentList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'

/**
 * The handles `DocumentPanel` does NOT exercise.
 *
 * The panel reads through this collection but keeps its own valibot-parsed
 * writes, so the resource's list shape and its create/update/destroy wiring
 * would break silently: no panel spec fails until someone calls them. This
 * spec pins the seam itself - the query the customer kind asks for, and that
 * each write reaches the customer endpoint stamped with its parent.
 */

const api = installApiSeam()

const DOC_ITEM = itemSchemaOf(vPaginatedCustomerDocumentList)

const STORED = () =>
  fixtureFor(DOC_ITEM, {
    id: 9,
    customer: 5,
    name: 'Manual.pdf',
    description: 'The manual',
    file: 'https://tenant.example/media/documents/manual.pdf',
    filename: 'manual.pdf',
    url: 'https://tenant.example/media/documents/manual.pdf',
    user_can_view: true,
  })

const Harness = defineComponent({
  template: '<div />',
  setup() {
    const collection = useDocumentCollection(customerDocumentResource, ref(5))
    return { collection }
  },
})

async function mountCollection() {
  const wrapper = mountForm(Harness, { deep: true })
  await settle()
  return wrapper
}

beforeEach(() => {
  api.get('/api/customer/document/', paginated([STORED()]))
  api.post('/api/customer/document/', fixtureFor(DOC_ITEM, { id: 12, customer: 5 }))
  api.patch('/api/customer/document/{id}/', STORED())
  api.delete('/api/customer/document/{id}/', noContent)
})

describe('useDocumentCollection, customer kind', () => {
  test('asks for every document of the customer, not just the first page', async () => {
    const wrapper = await mountCollection()

    expect(api.requests()).toEqual([
      {
        method: 'get',
        path: '/api/customer/document/',
        query: { customer: '5', page: '1', page_size: '1000' },
      },
    ])
    expect(wrapper.vm.collection.rows.value).toHaveLength(1)
  })

  test('create POSTs the row stamped with its parent', async () => {
    const wrapper = await mountCollection()

    await wrapper.vm.collection.create({ name: 'manual.pdf', file: 'data:application/pdf;base64,eHl6' }, 5)

    const posts = api.requests().filter((request) => request.method === 'post')
    expect(posts).toHaveLength(1)
    expect(posts[0].path).toBe('/api/customer/document/')
    expect(posts[0].body).toMatchObject({ customer: 5, name: 'manual.pdf' })
  })

  test('update PATCHes the row at its own path, stamped with its parent', async () => {
    const wrapper = await mountCollection()

    await wrapper.vm.collection.update({ id: 9, name: 'Manual v2.pdf' }, 5)

    const patch = api.requests().find((request) => request.method === 'patch')
    expect(patch.path).toBe('/api/customer/document/9/')
    expect(patch.body).toMatchObject({ customer: 5, name: 'Manual v2.pdf' })
  })

  test('destroy DELETEs the row at its own path', async () => {
    const wrapper = await mountCollection()

    await wrapper.vm.collection.destroy(9)

    expect(api.requests().filter((request) => request.method === 'delete')).toEqual([
      { method: 'delete', path: '/api/customer/document/9/', query: {} },
    ])
  })
})
