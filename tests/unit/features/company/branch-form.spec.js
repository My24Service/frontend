import { beforeEach, describe, expect, test, vi } from 'vitest'
import { vBranch } from '@/api/valibot.gen'
import BranchForm from '@/features/company/branch/BranchForm.vue'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: spy } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: spy }) }
})

const api = installApiSeam()

const BRANCH_PATH = '/api/company/branch/'
const MY_PATH = '/api/company/branch-my/'

const COUNTRIES = [
  { value: 'NL', text: 'Netherlands' },
  { value: 'DE', text: 'Germany' },
]

/** A stored branch: its `image` is the response URL, not base64. */
const BRANCH = fixtureFor(vBranch, {
  id: 9,
  name: 'Vestiging Noord',
  address: 'Voorstraat 1',
  postal: '9711 AA',
  city: 'Groningen',
  country_code: 'NL',
  tel: '050-1234567',
  email: 'noord@example.com',
  contact: 'J. Jansen',
  mobile: '06-12345678',
  image: 'https://example.com/media/branch.jpg',
  created: '01-01-2026',
  modified: '02-01-2026',
})

const bodies = () => toasts().map((toast) => toast.body)
const writes = () => api.requests()
  .filter((request) => ['post', 'patch'].includes(request.method))

/** Let every request a submit sets off come back. */
async function drain(wrapper) {
  for (let i = 0; i < 4; i++) {
    await settle()
    await wrapper.vm.$nextTick()
  }
}

async function click(wrapper, label) {
  await wrapper.findAll('button').find((button) => button.text() === label).trigger('click')
  await drain(wrapper)
}

/** Pick a file the way the browser's picker does: a `change` event. */
async function chooseFile(wrapper, name = 'branch.png') {
  const input = wrapper.get('input[type="file"]')
  const file = new File(['fake-png-bytes'], name, { type: 'image/png' })
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await drain(wrapper)
}

function previewSrc(wrapper, heading) {
  const h3 = wrapper.findAll('h3').find((h) => h.text() === heading)
  return h3.element.parentElement.querySelector('img').getAttribute('src')
}

async function fillRequired(wrapper, overrides = {}) {
  const values = {
    '#branch_name': 'Vestiging Noord',
    '#branch_address': 'Voorstraat 1',
    '#branch_postal': '9711 AA',
    '#branch_city': 'Groningen',
    ...overrides,
  }
  for (const [selector, value] of Object.entries(values)) {
    await wrapper.get(selector).setValue(value)
  }
  await settle()
}

beforeEach(() => {
  api.get('/api/company/branch/{id}/', BRANCH)
  api.post(BRANCH_PATH, ({ body }) => fixtureFor(vBranch, { id: 10, ...body }))
  api.patch('/api/company/branch/{id}/', ({ body }) => fixtureFor(vBranch, { id: 9, ...body }))
  api.get(MY_PATH, BRANCH)
  api.patch(MY_PATH, ({ body }) => fixtureFor(vBranch, { id: 9, ...body }))
})

function mountBranch(options = {}) {
  return mountForm(BranchForm, {
    deep: true,
    props: { pk: null },
    main: { getCountries: COUNTRIES },
    ...options,
  })
}

describe('BranchForm create', () => {
  test('empty required fields block the submit', async () => {
    const wrapper = mountBranch()
    await settle()

    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please enter a name')
    expect(wrapper.text()).toContain('Please enter an address')
    expect(wrapper.text()).toContain('Please enter a postal')
    expect(wrapper.text()).toContain('Please enter a city')
    expect(writes()).toHaveLength(0)
  })

  test('a filled form creates with no image key', async () => {
    const wrapper = mountBranch()
    await settle()

    await fillRequired(wrapper)
    await click(wrapper, 'Submit')

    const post = writes().find((request) => request.method === 'post')
    expect(post.path).toBe(BRANCH_PATH)
    expect(post.body).toEqual({
      name: 'Vestiging Noord',
      address: 'Voorstraat 1',
      postal: '9711 AA',
      city: 'Groningen',
      country_code: 'NL',
    })
    expect(bodies()).toContain('Branch has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a picked file previews and rides the body as base64', async () => {
    const wrapper = mountBranch()
    await settle()

    await fillRequired(wrapper)
    await chooseFile(wrapper)

    expect(previewSrc(wrapper, 'Upload preview')).toMatch(/^data:image\/png;base64,/)
    await click(wrapper, 'Submit')

    const post = writes().find((request) => request.method === 'post')
    expect(post.body.image).toMatch(/^data:image\/png;base64,/)
    expect(bodies()).toContain('Branch has been created')
  })

  test('a failed create keeps the form and reports it', async () => {
    api.post(BRANCH_PATH, serverError)
    const wrapper = mountBranch()
    await settle()

    await fillRequired(wrapper)
    await click(wrapper, 'Submit')

    expect(bodies()).toContain('Error creating branch')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('BranchForm edit', () => {
  test('the record fills the fields and shows its stored image', async () => {
    const wrapper = mountBranch({ props: { pk: 9 } })
    await settle()

    expect(wrapper.get('#branch_name').element.value).toBe('Vestiging Noord')
    expect(wrapper.get('#branch_city').element.value).toBe('Groningen')
    expect(previewSrc(wrapper, 'Current image')).toBe('https://example.com/media/branch.jpg')
  })

  test('saving without a new file sends no image key', async () => {
    const wrapper = mountBranch({ props: { pk: 9 } })
    await settle()

    // The record's own `image` is a URL the write endpoint rejects; an
    // absent PATCH key leaves the stored file unchanged.
    await wrapper.get('#branch_name').setValue('Vestiging Noord, renamed')
    await click(wrapper, 'Submit')

    const patch = writes().find((request) => request.method === 'patch')
    expect(patch.path).toBe(BRANCH_PATH + '9/')
    expect(patch.body).not.toHaveProperty('image')
    // The planning path never touches the my-branch endpoint.
    expect(writes()).toHaveLength(1)
    expect(bodies()).toContain('Branch has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a picked file replaces the stored image', async () => {
    const wrapper = mountBranch({ props: { pk: 9 } })
    await settle()

    await chooseFile(wrapper)
    await click(wrapper, 'Submit')

    const patch = writes().find((request) => request.method === 'patch')
    expect(patch.body.image).toMatch(/^data:image\/png;base64,/)
    expect(bodies()).toContain('Branch has been updated')
  })
})

describe('BranchForm own branch', () => {
  function mountMyBranch(options = {}) {
    return mountBranch({
      auth: { isBranchEmployee: true },
      ...options,
    })
  }

  test('a branch employee edits their own branch without a pk', async () => {
    const wrapper = mountMyBranch()
    await settle()

    // The read went to branch-my, not to a pk detail.
    expect(api.requests().filter((request) => request.method === 'get').map((request) => request.path))
      .toEqual([MY_PATH])
    expect(wrapper.get('#branch_name').element.value).toBe('Vestiging Noord')
  })

  test('saving writes branch-my and stays on the form', async () => {
    const wrapper = mountMyBranch()
    await settle()

    await wrapper.get('#branch_name').setValue('Vestiging Noord, renamed')
    await click(wrapper, 'Submit')

    const patch = writes().find((request) => request.method === 'patch')
    expect(patch.path).toBe(MY_PATH)
    expect(patch.body).toMatchObject({ name: 'Vestiging Noord, renamed' })
    expect(patch.body).not.toHaveProperty('image')
    expect(bodies()).toContain('Branch has been updated')
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('a failed save reports and keeps the form editable', async () => {
    api.patch(MY_PATH, serverError)
    const wrapper = mountMyBranch()
    await settle()

    await wrapper.get('#branch_name').setValue('Vestiging Noord, renamed')
    await click(wrapper, 'Submit')

    // The pathless variant overrides the kit's mutationFn, so this pins that
    // the override kept the throw: without it a 500 read as a success.
    expect(bodies()).toContain('Error updating branch')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})
