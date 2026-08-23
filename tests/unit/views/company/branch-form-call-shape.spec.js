import { beforeEach, describe, expect, test, vi } from 'vitest'

import BranchForm from '@/views/company/BranchForm.vue'

import {
  mountForm,
  resetFakeHttp,
  routerGo,
  toastCreate,
  toastTitles,
} from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// Call-shape characterisation for BranchForm's non-branch-employee path: it
// runs BaseModel CRUD (detail/update) against /company/branch/{pk}/ and never
// touches the my-branch endpoint.
//
// The branch-employee path is not pinned here. Its specs asserted the
// generated companyBranchMy* ops, whose PATCH body differs from what this
// branch's BranchService.updateMyBranch() sends (it strips created/modified),
// so they were dropped rather than reinterpreted (#315).

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

/**
 * What /api/company/branch-my/ returns. `created`/`modified` are deliberately
 * present: the branch-my serializer sends them, and they make the one
 * old-vs-new body disagreement observable (see the submit tests).
 */
const BRANCH = {
  id: 7,
  name: 'Branch Amsterdam',
  address: 'Kerkstraat 1',
  postal: '1000 AA',
  city: 'Amsterdam',
  country_code: 'NL',
  tel: '0201234567',
  email: 'branch@example.test',
  contact: 'Jan',
  mobile: '0612345678',
  image: 'data:image/png;base64,AAAA',
  created: '2024-01-01T00:00:00Z',
  modified: '2024-02-02T00:00:00Z',
}

const ROUTES = {
  '/company/branch-my/': BRANCH,
  '/company/branch/7/': BRANCH,
}

function mount({ pk = null, auth = {} } = {}) {
  return mountForm(BranchForm, {
    props: { pk },
    main: { getCountries: [{ value: 'NL', text: 'Netherlands' }] },
    auth,
  })
}

/**
 * Mount and wait until created()'s loadData has actually assigned `branch`.
 * Waiting on the request alone is not enough: the GET is recorded
 * synchronously, while the branch assignment lands a microtask later - a
 * submitForm() racing that gap fails its v$.$invalid check.
 */
async function ready({ pk = null, auth = {} } = {}) {
  const wrapper = mount({ pk, auth })
  await vi.waitFor(() => expect(wrapper.vm.branch?.name).toBe('Branch Amsterdam'))
  return wrapper
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
  toastCreate.mockClear()
})

describe('BranchForm - non-branch-employee (guard)', () => {
  test('never calls the my-branch SDK ops; BaseModel CRUD is still used', async () => {
    const wrapper = await ready({ pk: 7, auth: { isBranchEmployee: false } })

    // detail() through the model, not the SDK.
    expect(requestShapes(fakeHttp, { method: 'get' })[0]).toEqual({
      method: 'get',
      path: '/api/company/branch/7/',
      query: {},
      body: undefined,
    })

    await wrapper.vm.submitForm()

    const patches = requestShapes(fakeHttp, { method: 'patch' })
    expect(patches).toHaveLength(1)
    expect(patches[0].path).toBe('/api/company/branch/7/')
    expect(patches.some((shape) => shape.path === '/api/company/branch-my/')).toBe(false)

    // The non-employee path still navigates back after a successful update.
    expect(toastTitles()).toEqual(['Updated'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
})
