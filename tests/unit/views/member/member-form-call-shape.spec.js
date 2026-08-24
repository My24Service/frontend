import { beforeEach, describe, expect, test, vi } from 'vitest'

import MemberForm from '@/views/member/MemberForm.vue'

import { installApiSeam } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'
import golden from '../../golden/member-form-create.json'

/**
 * MemberForm, run through the network seam (#318).
 *
 * This is the tracer bullet: the screen is still running its original code, so
 * what the golden records is what the application does today, not what a
 * migration made it do. Every other spec in the suite keeps its client fake and
 * comes across when its own Slice is converted.
 *
 * Two things are asserted, and they are different things:
 *
 *   - the golden — the *whole* set of requests the screen puts on the wire,
 *     recorded below the client. A dropped query parameter changes this file,
 *     which is exactly the failure the old client-fake seam could not see.
 *   - the behaviour the screen is for: `checkCompanyCode` resolving to the
 *     backend's `available` field.
 *
 * The seam is strict, so this spec also stands as evidence that MemberForm's
 * requests conform to `openapi/schema.yaml`: an undeclared parameter or a body
 * the request schema rejects fails here without an assertion being written for
 * it.
 */

// MemberForm calls useToast() in setup(). In the application that resolves
// through the <BApp> in App.vue; a mounted component has no such ancestor, so
// without this the mount throws before created() runs. Spread the original —
// the auto-import resolver rewrites <b-form-input> & friends into named
// imports from here, and replacing the module wholesale blanks every one.
vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const api = installApiSeam()

const CONTRACTS = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'Contract A' }] }

const MAIN = { getCountries: [] }

async function flushPromises() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  api.get('/api/member/contract/', CONTRACTS)
  api.get('/api/member/companycode-exists/', { available: true })
})

describe('MemberForm, creating a Member', () => {
  test('puts the recorded set of requests on the wire', async () => {
    const wrapper = mountForm(MemberForm, { main: MAIN })
    await flushPromises()

    await wrapper.vm.checkCompanyCode('acme')

    expect(api.requests()).toEqual(golden)
  })

  test('resolves the company code check to the backend answer', async () => {
    const wrapper = mountForm(MemberForm, { main: MAIN })
    await flushPromises()

    await expect(wrapper.vm.checkCompanyCode('acme')).resolves.toBe(true)

    api.get('/api/member/companycode-exists/', { available: false })
    await expect(wrapper.vm.checkCompanyCode('acme')).resolves.toBe(false)
  })
})
