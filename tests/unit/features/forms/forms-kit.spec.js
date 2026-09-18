import { beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'

import {
  companySalesuserCreateMutation,
  companySalesuserListQueryKey,
  companySalesuserPartialUpdateMutation,
  companySalesuserRetrieveOptions,
  memberMemberMySettingsPartialUpdateMutation,
  memberMemberMySettingsRetrieveOptions,
  memberMemberMySettingsRetrieveQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import { vMemberSettings, vSalesUser } from '@/api/valibot.gen'
import { useRoutePk } from '@/features/forms/use-route-pk'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { useResourceForm } from '@/features/forms/use-resource-form'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts, toastCreate } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const RECORD = fixtureFor(vSalesUser, {
  id: 11,
  username: 'jan',
  first_name: 'Jan',
  last_name: 'Jansen',
  full_name: 'Jan Jansen',
  email: 'jan@example.test',
})

const COPY = {
  fetchError: 'Error loading test',
  created: 'Created',
  createdDetail: 'Test has been created',
  updated: 'Updated',
  updatedDetail: 'Test has been updated',
  createError: 'Error creating test',
  updateError: 'Error updating test',
}

function validBody(values) {
  return {
    username: values.username,
    email: 'jan@example.test',
    first_name: values.first_name || 'Jan',
    last_name: 'Jansen',
    password: 'secret-password',
    sales_user: {
      uses_time_registration: false,
      contract_hours_week: '0.00',
    },
  }
}

const TestForm = defineComponent({
  props: {
    pk: { type: [String, Number], default: null },
    onSaved: { type: Function, default: undefined },
  },
  setup(props) {
    const form = useResourceForm({
      pk: () => props.pk,
      retrieve: (id) => companySalesuserRetrieveOptions({ path: { id } }),
      create: companySalesuserCreateMutation(),
      update: companySalesuserPartialUpdateMutation(),
      invalidate: (qc) => qc.invalidateQueries({ queryKey: companySalesuserListQueryKey() }),
      empty: () => ({ username: '', first_name: '' }),
      fromRecord: (record) => ({
        username: record.username,
        first_name: record.first_name ?? '',
      }),
      validate: (values) => {
        const errors = {}
        if (!values.username) errors.username = 'Username is required'
        return errors
      },
      parse: (values) => validBody(values),
      copy: COPY,
      onSaved: props.onSaved,
    })
    return { ...form }
  },
  template: `
    <div>
      <input id="test_username" v-model="values.username" />
      <div v-if="errors.username" class="invalid-feedback d-block">{{ errors.username }}</div>
      <button @click="submitForm" :disabled="buttonDisabled">Submit</button>
      <button @click="cancelForm">Cancel</button>
    </div>
  `,
})

async function mountTestForm(props = {}) {
  const wrapper = mountForm(TestForm, { deep: true, routes: [], props })
  await settle()
  return wrapper
}

async function submit(wrapper) {
  const save = wrapper.findAll('button').find((button) => button.text() === 'Submit')
  await save.trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
  await settle()
}

beforeEach(() => {
  api.get('/api/company/salesuser/{id}/', RECORD)
  api.post('/api/company/salesuser/', RECORD)
  api.patch('/api/company/salesuser/{id}/', RECORD)
})

describe('useRoutePk, the create/edit split', () => {
  test('a null pk is a create', () => {
    const { isCreate } = useRoutePk(() => null)

    expect(isCreate.value).toBe(true)
  })

  test('a pk is an edit with the numeric id', () => {
    const { isCreate, id } = useRoutePk(() => 11)

    expect(isCreate.value).toBe(false)
    expect(id.value).toBe(11)
  })

  test('a string route param is an edit with the numeric id', () => {
    const { isCreate, id } = useRoutePk(() => '11')

    expect(isCreate.value).toBe(false)
    expect(id.value).toBe(11)
  })
})

describe('useQueryErrorToast, the error watcher', () => {
  function mountToast(message = 'Error loading test') {
    const error = ref()
    mount(
      defineComponent({
        setup() {
          useQueryErrorToast(error, message)
          return () => h('div')
        },
      }),
    )
    return error
  }

  test('a failure surfaces the message as the toast body', async () => {
    const error = mountToast()

    error.value = new Error('down')
    await nextTick()

    expect(toasts().map((toast) => toast.body)).toEqual(['Error loading test'])
  })

  test('clearing the error afterwards toasts nothing more', async () => {
    const error = mountToast()

    error.value = new Error('down')
    await nextTick()
    error.value = null
    await nextTick()

    expect(toasts().map((toast) => toast.body)).toEqual(['Error loading test'])
  })

  test('an error that never held anything toasts nothing at all', async () => {
    const error = mountToast()

    error.value = null
    await nextTick()

    expect(toasts()).toEqual([])
  })

  // The maintenance-contract view's message carries the failure's own status,
  // so the hook takes a builder as well as a fixed label.
  test('a function message is built from the error the watcher saw', async () => {
    const error = mountToast((failure) => `Error loading test: ${failure.response?.status}`)

    error.value = { response: { status: 500, statusText: 'Server Error' } }
    await nextTick()

    expect(toasts().map((toast) => toast.body)).toEqual(['Error loading test: 500'])
  })
})

describe('useResourceForm, creating', () => {
  test('confirms the creation and goes back', async () => {
    const wrapper = await mountTestForm()

    await wrapper.get('#test_username').setValue('jan')
    await submit(wrapper)

    expect(api.requests().filter((sent) => sent.method === 'post')).toHaveLength(1)
    expect(toasts().map((toast) => toast.body)).toContain('Test has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('refuses an empty form, and sends nothing', async () => {
    const wrapper = await mountTestForm()

    await submit(wrapper)

    expect(wrapper.text()).toContain('Username is required')
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/company/salesuser/', serverError)
    const wrapper = await mountTestForm()

    await wrapper.get('#test_username').setValue('jan')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating test')
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('a double submit without an await between sends once', async () => {
    const wrapper = await mountTestForm()

    await wrapper.get('#test_username').setValue('jan')
    const save = wrapper.findAll('button').find((button) => button.text() === 'Submit')
    await save.trigger('click')
    await save.trigger('click')
    await settle()
    await wrapper.vm.$nextTick()
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'post')).toHaveLength(1)
  })

  test('an onSaved failure reports as a failed save and keeps the user on the form', async () => {
    const wrapper = await mountTestForm({
      onSaved: async () => {
        throw new Error('replay down')
      },
    })

    await wrapper.get('#test_username').setValue('jan')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating test')
    expect(toasts().map((toast) => toast.body)).not.toContain('Test has been created')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('useResourceForm, what submitForm answers', () => {
  test('true once the record is written, and the exit has run', async () => {
    const wrapper = await mountTestForm()
    await wrapper.get('#test_username').setValue('jan')

    const written = await wrapper.vm.submitForm()
    await settle()

    expect(written).toBe(true)
    expect(toasts().map((toast) => toast.body)).toContain('Test has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('false when validation refuses the form', async () => {
    const wrapper = await mountTestForm()

    expect(await wrapper.vm.submitForm()).toBe(false)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('false when the write fails', async () => {
    api.post('/api/company/salesuser/', serverError)
    const wrapper = await mountTestForm()
    await wrapper.get('#test_username').setValue('jan')

    expect(await wrapper.vm.submitForm()).toBe(false)
    expect(toasts().map((toast) => toast.body)).toContain('Error creating test')
  })

  test('false when onSaved fails, because the save did not complete', async () => {
    const wrapper = await mountTestForm({
      onSaved: async () => {
        throw new Error('replay down')
      },
    })
    await wrapper.get('#test_username').setValue('jan')

    expect(await wrapper.vm.submitForm()).toBe(false)
  })

  test('{stay: true} writes, toasts and invalidates, but does not leave', async () => {
    const wrapper = await mountTestForm()
    await wrapper.get('#test_username').setValue('jan')

    const written = await wrapper.vm.submitForm({ stay: true })
    await settle()

    expect(written).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toHaveLength(1)
    expect(toasts().map((toast) => toast.body)).toContain('Test has been created')
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('staying is per submit: the next plain submit leaves again', async () => {
    const wrapper = await mountTestForm()
    await wrapper.get('#test_username').setValue('jan')

    await wrapper.vm.submitForm({ stay: true })
    await settle()
    expect(routerGo()).not.toHaveBeenCalled()

    await wrapper.vm.submitForm()
    await settle()
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a click event as the argument is not read as options', async () => {
    const wrapper = await mountTestForm()
    await wrapper.get('#test_username').setValue('jan')

    const written = await wrapper.vm.submitForm(new MouseEvent('click'))
    await settle()

    expect(written).toBe(true)
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
})

describe('useResourceForm, a pathless singleton record', () => {
  const SETTINGS = fixtureFor(vMemberSettings, { date_format: '%d/%m/%Y' })

  /**
   * A record with no `:pk` and no create: the tenant's settings, which the
   * settings form edits through `member/my_settings/`. Its endpoint declares
   * no path, so `updateVars` sends only the body and `create` is left out.
   */
  const SingletonForm = defineComponent({
    props: { pk: { type: [String, Number], default: 'my' } },
    setup(props) {
      const form = useResourceForm({
        pk: () => props.pk,
        retrieve: () => memberMemberMySettingsRetrieveOptions(),
        update: memberMemberMySettingsPartialUpdateMutation(),
        updateVars: (body) => ({ body }),
        invalidate: (qc) => qc.invalidateQueries({ queryKey: memberMemberMySettingsRetrieveQueryKey() }),
        empty: () => ({ date_format: '' }),
        fromRecord: (record) => ({ date_format: record.date_format ?? '' }),
        validate: () => ({}),
        parse: (values) => ({ date_format: values.date_format }),
        afterSave: async () => {},
        copy: COPY,
      })
      return { ...form }
    },
    template: `
      <div>
        <input id="singleton_date_format" v-model="values.date_format" />
        <button @click="submitForm">Submit</button>
      </div>
    `,
  })

  beforeEach(() => {
    api.get('/api/member/member/my_settings/', SETTINGS)
    api.patch('/api/member/member/my_settings/', SETTINGS)
  })

  test('updateVars shapes the update: only the body reaches the pathless endpoint', async () => {
    const wrapper = mountForm(SingletonForm, { deep: true, routes: [] })
    await settle()

    await wrapper.get('#singleton_date_format').setValue('%Y-%m-%d')
    await submit(wrapper)

    const patch = api.requests().find((sent) => sent.method === 'patch')
    expect(patch.path).toBe('/api/member/member/my_settings/')
    expect(patch.body).toEqual({ date_format: '%Y-%m-%d' })
    expect(toasts().map((toast) => toast.body)).toContain('Test has been updated')
  })

  test('a create attempt without a create mutation fails loudly and sends nothing', async () => {
    const wrapper = mountForm(SingletonForm, { deep: true, routes: [], props: { pk: null } })
    await settle()

    expect(await wrapper.vm.submitForm()).toBe(false)
    expect(api.requests().filter((sent) => sent.method !== 'get')).toEqual([])
    expect(toasts().map((toast) => toast.body)).toContain('Error creating test')
  })
})

describe('useResourceForm, the write context', () => {
  /**
   * A form that records the context each of its three callbacks was handed, so
   * one submit shows what `validate`, `parse` and `onSaved` each saw.
   */
  function contextForm(seen) {
    return defineComponent({
      props: { pk: { type: [String, Number], default: null } },
      setup(props) {
        const form = useResourceForm({
          pk: () => props.pk,
          retrieve: (id) => companySalesuserRetrieveOptions({ path: { id } }),
          create: companySalesuserCreateMutation(),
          update: companySalesuserPartialUpdateMutation(),
          invalidate: (qc) => qc.invalidateQueries({ queryKey: companySalesuserListQueryKey() }),
          empty: () => ({ username: '', first_name: '' }),
          fromRecord: (record) => ({
            username: record.username,
            first_name: record.first_name ?? '',
          }),
          validate: (values, context) => {
            seen.validate = context
            return values.username ? {} : { username: 'Username is required' }
          },
          parse: (values, context) => {
            seen.parse = context
            return validBody(values)
          },
          onSaved: async (result, context) => {
            seen.onSaved = context
          },
          copy: COPY,
        })
        return { ...form }
      },
      template: `
        <div>
          <input id="context_username" v-model="values.username" />
          <button @click="submitForm">Submit</button>
        </div>
      `,
    })
  }

  test('a create says so, and carries no id rather than a NaN one', async () => {
    const seen = {}
    const wrapper = mountForm(contextForm(seen), { deep: true, routes: [] })
    await settle()

    await wrapper.get('#context_username').setValue('jan')
    await submit(wrapper)

    expect(seen.validate).toEqual({ isCreate: true, id: null })
    expect(seen.parse).toEqual({ isCreate: true, id: null })
    expect(seen.onSaved).toEqual({ isCreate: true, id: null })
  })

  test('an edit carries the numeric id', async () => {
    const seen = {}
    const wrapper = mountForm(contextForm(seen), { deep: true, routes: [], props: { pk: 11 } })
    await settle()

    await wrapper.get('#context_username').setValue('jan')
    await submit(wrapper)

    expect(seen.validate).toEqual({ isCreate: false, id: 11 })
    expect(seen.parse).toEqual({ isCreate: false, id: 11 })
    expect(seen.onSaved).toEqual({ isCreate: false, id: 11 })
  })
})

describe('useResourceForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountTestForm()

    await wrapper.get('#test_username').setValue('jan')
    const cancel = wrapper.findAll('button').find((button) => button.text() === 'Cancel')
    await cancel.trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})
