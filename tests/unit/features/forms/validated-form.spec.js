import { afterEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'

import ValidatedForm from '@/features/forms/ValidatedForm.vue'
import ValidatedFormField from '@/features/forms/ValidatedFormField.vue'

enableAutoUnmount(afterEach)

/**
 * The seam between a form and the fields in it: a field names itself and the
 * form answers for its id, its value, its copy, its error and its submitted
 * state.
 */

const FIELD_MESSAGES = {
  city: () => 'Please enter a city',
  postal: () => 'Please enter a postal',
}

const FIELD_LABELS = {
  city: () => 'City',
  postal: () => 'Postal',
}

/** A form with the given fields in it. */
function mountForm({ fields = [{ name: 'city' }], values = {}, errors = {}, submitted = false } = {}) {
  const form = reactive({
    values: { city: '', postal: '', vat_number: '', ...values },
    errors: { ...errors },
    submitted,
    name: 'member',
  })

  const wrapper = mount(defineComponent({
    setup() {
      return () => h(ValidatedForm, {
        name: form.name,
        modelValue: form.values,
        errors: form.errors,
        messages: FIELD_MESSAGES,
        labels: FIELD_LABELS,
        submitted: form.submitted,
      }, { default: () => fields.map((field) => h(ValidatedFormField, field)) })
    },
  }))

  return { wrapper, form }
}

describe('ValidatedForm, what a named field derives', () => {
  test('names the field: id, label and copy all follow', () => {
    const { wrapper } = mountForm()

    expect(wrapper.get('#member_city').exists()).toBe(true)
    expect(wrapper.get('label').text()).toBe('City')
    expect(wrapper.get('.invalid-feedback').text()).toBe('Please enter a city')
  })

  test('opens on the value the form object already carries', () => {
    const { wrapper } = mountForm({ values: { city: 'Amsterdam' } })

    expect(wrapper.get('#member_city').element.value).toBe('Amsterdam')
  })

  test('writes what the user types back onto the form object, under the field name', async () => {
    const { wrapper, form } = mountForm()

    await wrapper.get('#member_city').setValue('Amsterdam')

    expect(form.values.city).toBe('Amsterdam')
    expect(form.values.postal).toBe('')
  })

  test('names the field through the prop the form reads', () => {
    const { wrapper } = mountForm({ fields: [{ name: 'postal' }] })

    expect(wrapper.get('#member_postal').exists()).toBe(true)
  })

  test('falls back to the field name when the form has no label for it', () => {
    const { wrapper } = mountForm({ fields: [{ name: 'vat_number' }] })

    expect(wrapper.get('label').text()).toBe('vat_number')
  })
})

describe('ValidatedForm, what it hands down', () => {
  test('shows the field its error, and only claims a state once submitted', async () => {
    const { wrapper, form } = mountForm()

    form.errors.city = 'Please enter a city'
    form.submitted = true
    await wrapper.vm.$nextTick()

    expect(wrapper.get('#member_city').classes()).toContain('is-invalid')
    expect(wrapper.get('.invalid-feedback').classes()).toContain('d-block')
  })

  test('an explicit prop still wins over the form', () => {
    const { wrapper } = mountForm({
      fields: [{ name: 'city', id: 'delivery_city', label: 'Stad' }],
    })

    expect(wrapper.find('#member_city').exists()).toBe(false)
    expect(wrapper.get('#delivery_city').exists()).toBe(true)
    expect(wrapper.get('label').text()).toBe('Stad')
  })

  test('a field named something the form does not have says so, and still renders', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { wrapper } = mountForm({ fields: [{ name: 'adress' }] })

    expect(wrapper.get('#member_adress').exists()).toBe(true)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"adress"'))
    warn.mockRestore()
  })

  test('a field the form does have is not reported', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mountForm({ fields: [{ name: 'city' }, { name: 'postal' }] })

    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('ValidatedFormField, inside a form', () => {
  test('a textarea field keeps its own control and still takes its copy from the form', () => {
    const { wrapper } = mountForm({ fields: [{ name: 'postal', textarea: true, rows: 3 }] })

    expect(wrapper.get('textarea#member_postal').attributes('rows')).toBe('3')
    expect(wrapper.get('.invalid-feedback').text()).toBe('Please enter a postal')
  })
})
