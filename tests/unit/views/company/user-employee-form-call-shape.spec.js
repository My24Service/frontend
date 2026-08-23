import { beforeEach, describe, expect, test, vi } from 'vitest'

import UserEmployeeForm from '@/views/company/UserEmployeeForm.vue'

import { mountForm, resetFakeHttp, toastCreate } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for UserEmployeeForm's migrated branch call site.
 *
 * Pre-refactor (192a67d9) the branch-employee branch of created() called
 * branchService.getMyBranch() (src/models/company/Branch.js), which did
 * `axios.get('/company/branch-my/')`. The refactor replaced it with the
 * generated companyBranchMyRetrieve op (GET /api/company/branch-my/), and the
 * view reads the returned branch off `.data`. Path and method are unchanged.
 *
 * The op is only reached when the logged-in user is a branch employee
 * (auth store isBranchEmployee); non-branch employees still take the BaseModel
 * branchService.list() path, which is out of scope for this refactor.
 */

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

const BRANCH = {
  id: 7,
  name: 'Branch Amsterdam',
  city: 'Amsterdam',
}

/** Drain microtasks so created()'s async branch fetch settles. */
async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  // The non-branch path reads response.results off the BaseModel list, so the
  // branch fixture must be paginated like the real endpoint; branch-my is the
  // (unpaginated) object the generated op returns. The BaseModel list URL has
  // no /api prefix on the wire; the SDK op's does.
  resetFakeHttp(fakeHttp, {
    '/company/branch/': { results: [] },
    '/company/branch-my/': BRANCH,
  })
  toastCreate.mockClear()
})

describe('UserEmployeeForm - created()', () => {
  test('branch employees fetch their branch through the generated op', async () => {
    const wrapper = mountForm(UserEmployeeForm, {
      main: { getMemberHasBranches: true },
      auth: {
        userInfo: { submodel: 'employee_user', user: { employee_user: { branch: { id: 7 } } } },
      },
    })
    await flush()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/company/branch-my/', query: {}, body: undefined },
    ])
  })

  test('non-branch employees take the BaseModel branch list, not the op', async () => {
    const wrapper = mountForm(UserEmployeeForm, {
      main: { getMemberHasBranches: true },
      auth: {
        userInfo: { submodel: 'employee_user', user: { employee_user: {} } },
      },
    })
    await flush()

    const shapes = requestShapes(fakeHttp, { method: 'get' })
    expect(shapes.map((shape) => shape.path)).not.toContain('/api/company/branch-my/')
    // The old getMyBranch() is gone; the only branch GET left is the CRUD list.
    expect(shapes).toEqual([
      { method: 'get', path: '/api/company/branch/', query: { page: '1' }, body: undefined },
    ])
  })
})
