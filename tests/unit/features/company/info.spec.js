import { beforeEach, describe, expect, test, vi } from 'vitest'
import { vMember } from '@/api/valibot.gen'
import { CompanyInfo } from '@/features/company'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: spy } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: spy }) }
})

const api = installApiSeam()

const ME_PATH = '/api/member/member/me/'

const COUNTRIES = [
  { value: 'NL', text: 'Netherlands' },
  { value: 'DE', text: 'Germany' },
]

const MEMBER = fixtureFor(vMember, {
  companycode: 'acme',
  name: 'Acme BV',
  address: 'Voorstraat 1',
  postal: '9711 AA',
  city: 'Groningen',
  country_code: 'NL',
  tel: '050-1234567',
  email: 'info@acme.test',
  www: 'https://acme.test',
  contacts: 'Jan Jansen',
  info: 'Some info',
  activities: 'Some activities',
  chamber_of_commerce: '12345678',
  vat_number: 'NL123456789B01',
  companylogo: 'https://example.com/media/logo.png',
  companylogo_workorder: 'https://example.com/media/workorder.png',
})

const bodies = () => toasts().map((toast) => toast.body)
const writes = () => api.requests().filter((request) => request.method === 'patch')

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

/**
 * Pick a file the way the browser's picker does: a `change` event on the
 * native input. BFormFile puts the `id` on its browse *button*, so the input
 * is found by type; the screen has two, in DOM order (logo, workorder).
 */
async function chooseFile(wrapper, index, name) {
  const input = wrapper.findAll('input[type="file"]')[index]
  const file = new File(['fake-png-bytes'], name, { type: 'image/png' })
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await drain(wrapper)
}

/** The read-only switch is the fieldset's `disabled`, not each input's. */
function fieldsDisabled(wrapper) {
  return wrapper.get('fieldset').attributes('disabled') !== undefined
}

function logoImage(wrapper) {
  return wrapper.get('.profile-picture img').attributes('src')
}

beforeEach(() => {
  api.get(ME_PATH, MEMBER)
  api.patch(ME_PATH, ({ body }) => fixtureFor(vMember, { ...MEMBER, ...body }))
})

function mountInfo(options = {}) {
  return mountForm(CompanyInfo, {
    deep: true,
    main: { getCountries: COUNTRIES },
    ...options,
  })
}

describe('CompanyInfo', () => {
  test('reads the tenant record and shows it read-only', async () => {
    const wrapper = mountInfo()
    await settle()

    expect(api.requests().filter((request) => request.method === 'get').map((request) => request.path))
      .toEqual([ME_PATH])
    expect(wrapper.get('#member_name').element.value).toBe('Acme BV')
    expect(wrapper.get('#member_companycode').element.value).toBe('acme')
    // Read-only until Edit: the fieldset disables every input.
    expect(fieldsDisabled(wrapper)).toBe(true)
    expect(logoImage(wrapper)).toBe('https://example.com/media/logo.png')
  })

  test('a failed read tells the user', async () => {
    api.get(ME_PATH, serverError)
    mountInfo()
    await settle()

    expect(bodies()).toContain('Error fetching member info')
  })

  test('editing enables the fields and saving patches the record', async () => {
    const wrapper = mountInfo()
    await settle()

    await click(wrapper, 'Edit')
    expect(fieldsDisabled(wrapper)).toBe(false)

    await wrapper.get('#member_name').setValue('Acme BV, renamed')
    await click(wrapper, 'Save')

    const patch = writes().find((request) => request.path === ME_PATH)
    expect(patch.body).toMatchObject({
      name: 'Acme BV, renamed',
      address: 'Voorstraat 1',
      postal: '9711 AA',
      city: 'Groningen',
      tel: '050-1234567',
      email: 'info@acme.test',
      www: 'https://acme.test',
      contacts: 'Jan Jansen',
      info: 'Some info',
      activities: 'Some activities',
    })
    // The record's own logos are URLs the write endpoint rejects; an absent
    // key leaves the stored files unchanged.
    expect(patch.body).not.toHaveProperty('companylogo')
    expect(patch.body).not.toHaveProperty('companylogo_workorder')
    expect(bodies()).toContain('Info updated')
  })

  test('a blank required field blocks the save', async () => {
    const wrapper = mountInfo()
    await settle()

    await click(wrapper, 'Edit')
    await wrapper.get('#member_name').setValue('')
    await click(wrapper, 'Save')

    expect(wrapper.text()).toContain('Please enter a name')
    expect(writes()).toHaveLength(0)
  })

  test('an invalid website blocks the save with the website message', async () => {
    const wrapper = mountInfo()
    await settle()

    await click(wrapper, 'Edit')
    await wrapper.get('#member_www').setValue('not a url')
    await click(wrapper, 'Save')

    expect(wrapper.text()).toContain('Please enter a website')
    expect(writes()).toHaveLength(0)
  })

  test('cancel restores the record and goes read-only', async () => {
    const wrapper = mountInfo()
    await settle()

    await click(wrapper, 'Edit')
    await wrapper.get('#member_name').setValue('Changed but cancelled')
    await click(wrapper, 'Cancel')

    expect(wrapper.get('#member_name').element.value).toBe('Acme BV')
    expect(fieldsDisabled(wrapper)).toBe(true)
    expect(writes()).toHaveLength(0)
  })

  test('a picked logo previews and rides the body as base64', async () => {
    const wrapper = mountInfo()
    await settle()

    await click(wrapper, 'Edit')
    await chooseFile(wrapper, 0, 'logo.png')

    expect(logoImage(wrapper)).toMatch(/^data:image\/png;base64,/)
    await click(wrapper, 'Save')

    const patch = writes().find((request) => request.path === ME_PATH)
    expect(patch.body.companylogo).toMatch(/^data:image\/png;base64,/)
  })

  test('a picked workorder logo rides its own key', async () => {
    const wrapper = mountInfo()
    await settle()

    await click(wrapper, 'Edit')
    await chooseFile(wrapper, 1, 'workorder.png')
    await click(wrapper, 'Save')

    const patch = writes().find((request) => request.path === ME_PATH)
    expect(patch.body.companylogo_workorder).toMatch(/^data:image\/png;base64,/)
    expect(patch.body).not.toHaveProperty('companylogo')
  })

  test('a failed save keeps the form editable and reports it', async () => {
    api.patch(ME_PATH, serverError)
    const wrapper = mountInfo()
    await settle()

    await click(wrapper, 'Edit')
    await wrapper.get('#member_name').setValue('Acme BV, renamed')
    await click(wrapper, 'Save')

    expect(bodies()).toContain('Error updating info')
    expect(fieldsDisabled(wrapper)).toBe(false)
  })
})
