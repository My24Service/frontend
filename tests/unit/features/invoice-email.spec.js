import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import { EmailForm } from '@/features/invoice'
import { validateEmail } from '@/features/invoice'
import { vInvoice, vInvoiceEmail, vOrderDetail, vCustomer } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { HttpResponse } from 'msw'
import { mountListView, toastCreate, toasts, createTestQueryClient } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'
import { invoiceEmailGetUnsentEmailRetrieveQueryKey } from '@/api/@tanstack/vue-query.gen'
vi.mock('bootstrap-vue-next', async (original) => ({...(await original()), useToast: () => ({create: toastCreate})}))
enableAutoUnmount(afterEach)
const api = installApiSeam()
const base = '/api/invoice/email/'
const routes = [{name: 'invoices-sent', path: '/sent', component: {template: '<div />'}}]
const empty = {invoice: null, recipients: '', subject: '', body: '', is_sent: false, sent_date: null}
const sent = () => fixtureFor(vInvoiceEmail, {id: 9, invoice: 8, recipients: 'billing@example.test', subject: 'Invoice', body: '', is_sent: true})
let draft
beforeEach(() => {
  draft = {...empty}
  api.get(base + 'get_unsent_email/', () => draft)
  api.get(base + 'get_documents/', [])
  api.get('/api/invoice/invoice/{id}/', ({params}) => fixtureFor(vInvoice, {id: Number(params.id), invoice_id: 'INV-' + params.id, order: 42, invoice_email: 'billing@example.test'}))
  api.get('/api/order/order/{id}/', fixtureFor(vOrderDetail, {id: 42, customer_relation: 5}))
  api.get('/api/customer/customer/{id}/', fixtureFor(vCustomer, {id: 5, email: 'billing@example.test, contact@example.test'}))
  api.post(base, sent)
  api.patch(base + '{id}/', sent)
})
async function mountEmail(queryClient) {
  const wrapper = await mountListView(EmailForm, {deep: true, routes, query: {invoiceId: '8'}, queryClient})
  await settle()
  return wrapper
}
async function submit(wrapper) {
  await wrapper.findAll('button').find(b => b.text() === 'Submit').trigger('click')
  await settle()
}
const writes = () => api.requests().filter(r => ['post', 'patch'].includes(r.method))
test('loads typed draft, docs, invoice and customer through E unified order retrieve', async () => {
  const wrapper = await mountEmail()
  expect(api.requests().map(r => r.path)).toEqual(expect.arrayContaining([base + 'get_unsent_email/', base + 'get_documents/', '/api/order/order/42/', '/api/customer/customer/5/']))
  expect(api.requests().find(r => r.path === base + 'get_documents/').query).toEqual({invoiceId: '8'})
  expect(wrapper.text()).toContain('INV-8')
  expect(wrapper.text()).toContain('No attached documents')
})
test('creates using deduplicated recipients and only write fields', async () => {
  const wrapper = await mountEmail()
  await wrapper.get('#email_subject').setValue('Invoice')
  await submit(wrapper)
  expect(writes()).toHaveLength(1)
  expect(writes()[0]).toMatchObject({method: 'post', body: {invoice: 8, recipients: 'billing@example.test,contact@example.test', subject: 'Invoice', body: ''}})
  expect(wrapper.vm.$route.name).toBe('invoices-sent')
})
test('patches a persisted draft instead of creating again', async () => {
  draft = {...empty, id: 9, invoice: 8, subject: 'Draft', recipients: 'draft@example.test'}
  const wrapper = await mountEmail()
  await submit(wrapper)
  expect(writes()[0]).toMatchObject({method: 'patch', path: base + '9/'})
})
test('failed delivery retains created id and retries with PATCH', async () => {
  api.post(base, () => ({...sent(), is_sent: false}))
  const wrapper = await mountEmail()
  await wrapper.get('#email_subject').setValue('Invoice')
  await submit(wrapper)
  expect(wrapper.vm.$route.name).not.toBe('invoices-sent')
  expect(toasts().map(t => t.body)).toContain('Error sending invoice')
  await submit(wrapper)
  expect(writes().map(r => r.method)).toEqual(['post', 'patch'])
})
test('refuses blank subject without sending', async () => {
  const wrapper = await mountEmail()
  await submit(wrapper)
  expect(writes()).toHaveLength(0)
  expect(wrapper.text()).toContain('Please enter a subject')
})
test.each(['', 'invalid', 'ok@example.test,invalid'])('rejects malformed recipient list %s', recipients => {
  expect(validateEmail({invoice: 8, recipients, subject: 'Invoice', body: ''}).recipients).toBeTruthy()
})
test('keeps generated subject maximum constraint', () => {
  expect(validateEmail({invoice: 8, recipients: 'ok@example.test', subject: 'x'.repeat(256), body: ''}).subject).toBeTruthy()
})
test('lookup error keeps submit disabled', async () => {
  api.get(base + 'get_unsent_email/', serverError)
  const wrapper = await mountEmail()
  expect(wrapper.findAll('button').find(b => b.text() === 'Submit').attributes('disabled')).toBeDefined()
  expect(toasts().map(t => t.body)).toContain('Error fetching unsent email')
})
test('write error preserves subject for retry', async () => {
  api.post(base, serverError)
  const wrapper = await mountEmail()
  await wrapper.get('#email_subject').setValue('Keep this')
  await submit(wrapper)
  expect(wrapper.get('#email_subject').element.value).toBe('Keep this')
  expect(toasts().map(t => t.body)).toContain('Error sending invoice')
})
test('query refetch never overwrites edited text', async () => {
  const client = createTestQueryClient()
  const wrapper = await mountEmail(client)
  await wrapper.get('#email_subject').setValue('Edited locally')
  draft = {...empty, subject: 'Server overwrite'}
  await client.invalidateQueries({queryKey: invoiceEmailGetUnsentEmailRetrieveQueryKey({query: {invoiceId: 8}})})
  await settle()
  expect(wrapper.get('#email_subject').element.value).toBe('Edited locally')
})
test('downloads the PDF attachment and revokes its object URL', async () => {
  const revoke = vi.fn()
  const create = vi.fn(() => 'blob:mock-url')
  const originalCreate = URL.createObjectURL
  const originalRevoke = URL.revokeObjectURL
  URL.createObjectURL = create
  URL.revokeObjectURL = revoke
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  api.post('/api/invoice/invoice/{id}/download_pdf/', new HttpResponse(new Uint8Array([37, 80, 68, 70]), {headers: {'Content-Type': 'application/pdf'}}))
  api.get(base + 'get_documents/', [{name: 'invoice.pdf', is_pdf: true}])
  try {
    const wrapper = await mountEmail()
    await wrapper.findAll('button').find(b => b.text().includes('Preview invoice PDF')).trigger('click')
    await settle()
    expect(create).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledWith('blob:mock-url')
    expect(api.requests().some(r => r.path === '/api/invoice/invoice/8/download_pdf/')).toBe(true)
  } finally {
    click.mockRestore()
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
  }
})
test('new invoice query resets the old draft', async () => {
  const wrapper = await mountEmail()
  await wrapper.get('#email_subject').setValue('Old invoice')
  await wrapper.vm.$router.push({query: {invoiceId: '10'}})
  await settle()
  expect(wrapper.get('#email_subject').element.value).toBe('')
  expect(api.requests().filter(r => r.path === base + 'get_unsent_email/').at(-1).query).toEqual({invoiceId: '10'})
})
