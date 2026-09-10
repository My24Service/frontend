import { beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'

import {
  companySalesuserCreateMutation,
  companySalesuserListQueryKey,
  companySalesuserPartialUpdateMutation,
  companySalesuserRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import { vSalesUser } from '@/api/valibot.gen'
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
