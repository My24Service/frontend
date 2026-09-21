import { beforeEach, describe, expect, test, vi } from 'vitest'

import { OrderDocumentsPanel } from '@/features/order'
import { vOrderDocument } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const STORED = () => [
  fixtureFor(vOrderDocument, { id: 3, order: 42, name: 'plan.pdf', description: 'the plan', filename: 'plan.pdf', url: 'https://files.example/plan.pdf' }),
  fixtureFor(vOrderDocument, { id: 4, order: 42, name: null, description: null, filename: 'photo.jpg', url: 'https://files.example/photo.jpg' }),
]

function file(name, contents = 'hello') {
  return new File([contents], name, { type: 'text/plain' })
}

async function mountPanel(documents = STORED()) {
  const wrapper = mountForm(OrderDocumentsPanel, {
    deep: true,
    props: { documents },
    // b-form-file has no meaningful DOM under happy-dom; the panel reads the
    // chosen files off the event it emits, which the stub emits verbatim.
    stubs: { 'b-form-file': { emits: ['change'], template: '<input type="file" @change="$emit(\'change\', $event)" />' } },
  })
  await settle()
  return wrapper
}

/** Pick files through the (stubbed) file input, as a change event carrying them. */
async function choose(wrapper, files) {
  const input = wrapper.get('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: files, configurable: true })
  await input.trigger('change')
  // FileReader resolves a tick later than the event
  await new Promise((resolve) => setTimeout(resolve, 10))
  await settle()
}

async function clickButton(wrapper, text) {
  const button = wrapper.findAll('button').find((b) => b.text() === text)
  if (!button) throw new Error(`no button labelled "${text}"`)
  await button.trigger('click')
}

beforeEach(() => {
  api.post('/api/order/document/', fixtureFor(vOrderDocument, { id: 5, order: 42 }), { status: 201 })
  api.patch('/api/order/document/{id}/', fixtureFor(vOrderDocument, { id: 3, order: 42 }))
  api.delete('/api/order/document/{id}/', noContent)
})

describe('OrderDocumentsPanel, the staged set', () => {
  test('lists the given documents by name, falling back to the filename, without a request', async () => {
    const wrapper = await mountPanel()

    expect(api.requests()).toEqual([])
    const names = wrapper.findAll('tbody tr td:first-child').map((td) => td.text())
    expect(names).toEqual(['plan.pdf', 'photo.jpg'])
  })

  test('with no documents it says so and offers the add form', async () => {
    const wrapper = await mountPanel([])

    expect(wrapper.text()).toContain('No documents')
    await clickButton(wrapper, 'Add document(s)')
    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
  })

  test('choosing files stages them as data URLs, named after the file, and closes the add form', async () => {
    const wrapper = await mountPanel([])
    await clickButton(wrapper, 'Add document(s)')

    await choose(wrapper, [file('a.txt'), file('b.txt')])

    expect(wrapper.findAll('tbody tr td:first-child').map((td) => td.text())).toEqual(['a.txt', 'b.txt'])
    expect(wrapper.find('input[type="file"]').exists()).toBe(false)
  })

  test('editing a row renames it in place; cancelling leaves it alone', async () => {
    const wrapper = await mountPanel()

    await wrapper.findAll('button[title="Edit"]')[0].trigger('click')
    await wrapper.get('#order-document-name').setValue('renamed.pdf')
    await clickButton(wrapper, 'Edit document')
    expect(wrapper.findAll('tbody tr td:first-child')[0].text()).toBe('renamed.pdf')

    await wrapper.findAll('button[title="Edit"]')[1].trigger('click')
    await wrapper.get('#order-document-name').setValue('nope')
    await clickButton(wrapper, 'Cancel')
    expect(wrapper.findAll('tbody tr td:first-child')[1].text()).toBe('photo.jpg')
  })

  test('deleting a stored row marks it and says so; a staged row just disappears', async () => {
    const wrapper = await mountPanel()

    await wrapper.findAll('button[title="Delete"]')[1].trigger('click')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(toasts().map((t) => t.title)).toEqual(['Marked for delete'])

    await clickButton(wrapper, 'Add document(s)')
    await choose(wrapper, [file('c.txt')])
    await wrapper.findAll('button[title="Delete"]')[1].trigger('click')
    expect(toasts()).toHaveLength(1)
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
  })

  test('the given documents replace the staged set when they change', async () => {
    const wrapper = await mountPanel()
    await wrapper.findAll('button[title="Delete"]')[0].trigger('click')

    await wrapper.setProps({ documents: [STORED()[0]] })
    await settle()

    expect(wrapper.findAll('tbody tr td:first-child').map((td) => td.text())).toEqual(['plan.pdf'])
  })
})

describe('OrderDocumentsPanel.replay', () => {
  test('PATCHes the kept rows without a file, POSTs the new ones with theirs, DELETEs the removed ones last', async () => {
    const wrapper = await mountPanel()
    await wrapper.findAll('button[title="Edit"]')[0].trigger('click')
    await wrapper.get('#order-document-name').setValue('renamed.pdf')
    await clickButton(wrapper, 'Edit document')
    await wrapper.findAll('button[title="Delete"]')[1].trigger('click')
    await clickButton(wrapper, 'Add document(s)')
    await choose(wrapper, [file('new.txt', 'xyz')])

    await wrapper.vm.replay(42)

    expect(api.requests()).toEqual([
      {
        method: 'patch',
        path: '/api/order/document/3/',
        query: {},
        body: { order: 42, name: 'renamed.pdf', description: 'the plan' },
      },
      {
        method: 'post',
        path: '/api/order/document/',
        query: {},
        body: { order: 42, name: 'new.txt', description: '', file: 'data:text/plain;base64,eHl6' },
      },
      { method: 'delete', path: '/api/order/document/4/', query: {}, body: undefined },
    ])
  })

  test('a replaced file on a stored row travels with the PATCH', async () => {
    const wrapper = await mountPanel()
    await wrapper.findAll('button[title="Edit"]')[0].trigger('click')
    await choose(wrapper, [file('plan-v2.pdf', 'v2')])
    await clickButton(wrapper, 'Edit document')

    await wrapper.vm.replay(42)

    expect(api.requests()[0]).toMatchObject({
      method: 'patch',
      path: '/api/order/document/3/',
      body: { order: 42, name: 'plan.pdf', file: 'data:text/plain;base64,djI=' },
    })
  })

  test('with nothing staged, replay writes nothing but the untouched rows', async () => {
    const wrapper = await mountPanel()

    await wrapper.vm.replay(42)

    expect(api.requests().map((r) => `${r.method} ${r.path}`)).toEqual([
      'patch /api/order/document/3/',
      'patch /api/order/document/4/',
    ])
  })

  test('a failed write rejects, so the form reports a failed save', async () => {
    const { HttpResponse } = await import('msw')
    api.post('/api/order/document/', new HttpResponse(JSON.stringify({ detail: 'nope' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }))
    const wrapper = await mountPanel([])
    await clickButton(wrapper, 'Add document(s)')
    await choose(wrapper, [file('new.txt')])

    await expect(wrapper.vm.replay(42)).rejects.toBeTruthy()
  })
})
