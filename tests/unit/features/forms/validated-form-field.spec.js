import { afterEach, describe, expect, test } from 'vitest'
import { defineComponent, reactive } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'

import { ValidatedForm } from '@/features/forms'
import { ValidatedFormField } from '@/features/forms'

enableAutoUnmount(afterEach)

/**
 * The shared `BFormGroup + input + feedback` field the forms repeat. Every
 * form renders it inside a `ValidatedForm` under its own name, so these specs
 * mount it that way too: the `modelValue` the mount takes is the form
 * object's opening value, and every other prop rides the field explicitly —
 * which is also how the forms state their exceptions.
 */

function mountField(props = {}, slots = {}) {
  const { modelValue = '', ...overrides } = { id: 'field', label: 'Name', modelValue: '', ...props }
  const slot = typeof slots.default === 'string' ? slots.default : ''
  return mount(defineComponent({
    components: { ValidatedForm, ValidatedFormField },
    setup() {
      const values = reactive({ field: modelValue })
      return { values, overrides }
    },
    template: `
      <ValidatedForm name="test" v-model="values">
        <ValidatedFormField name="field" v-bind="overrides">${slot}</ValidatedFormField>
      </ValidatedForm>`,
  }))
}

describe('ValidatedFormField, the feedback contract', () => {
  test('placeholder copy shows while the field sits untouched, without claiming a state', () => {
    const wrapper = mountField({ placeholder: 'Please enter a name' })

    const feedback = wrapper.get('.invalid-feedback')
    expect(feedback.text()).toBe('Please enter a name')
    expect(feedback.classes()).not.toContain('d-block')
    expect(wrapper.get('#field').classes()).not.toContain('is-invalid')
  })

  test('a submitted field with an error shows the error copy and marks the input invalid', () => {
    const wrapper = mountField({
      error: 'Please enter a name',
      placeholder: 'Please enter a name',
      submitted: true,
    })

    const feedback = wrapper.get('.invalid-feedback')
    expect(feedback.text()).toBe('Please enter a name')
    expect(feedback.classes()).toContain('d-block')
    expect(wrapper.get('#field').classes()).toContain('is-invalid')
  })

  test('claims nothing until the form has been submitted, even with an error in hand', () => {
    const wrapper = mountField({ error: 'Please enter a name', submitted: false })

    expect(wrapper.get('#field').classes()).not.toContain('is-invalid')
    expect(wrapper.find('.invalid-feedback.d-block').exists()).toBe(false)
  })

  test('a field with no error copy and no hint renders no feedback element', () => {
    const wrapper = mountField()

    expect(wrapper.find('.invalid-feedback').exists()).toBe(false)
  })

  test('emits the typed value for the v-model the forms bind', async () => {
    const wrapper = mountField()

    await wrapper.get('#field').setValue('SHLTR')

    expect(wrapper.findComponent(ValidatedFormField).emitted('update:modelValue')[0]).toEqual(['SHLTR'])
  })
})

describe('ValidatedFormField, the layout it renders', () => {
  test('stacks the label when the caller asks for no label columns', () => {
    const wrapper = mountField()

    expect(wrapper.find('.b-form-group .row').exists()).toBe(false)
    expect(wrapper.get('label').attributes('for')).toBe('field')
  })

  test('keeps the label columns the existing callers pass', () => {
    const wrapper = mountField({ labelCols: 4 })

    expect(wrapper.get('.b-form-group .row > div').classes()).toContain('col-4')
  })

  test('hands the autofill hint to the input, not to the group around it', () => {
    const wrapper = mountField({ autocomplete: 'new-password' })

    expect(wrapper.get('#field').attributes('autocomplete')).toBe('new-password')
  })

  test('renders a disabled input when the field is locked', () => {
    const wrapper = mountField({ disabled: true, modelValue: 'SHLTR' })

    expect(wrapper.get('#field').attributes('disabled')).toBeDefined()
  })

  test('an unlocked field renders no disabled attribute', () => {
    const wrapper = mountField()

    expect(wrapper.get('#field').attributes('disabled')).toBeUndefined()
  })

  test('renders the slot between the input and the feedback', () => {
    const wrapper = mountField({ placeholder: 'Please enter a name' }, {
      default: '<span class="between">meter</span>',
    })

    expect(wrapper.get('#field').element.nextElementSibling.className).toBe('between')
    expect(wrapper.get('.between').element.nextElementSibling.className).toContain('invalid-feedback')
  })

  test('renders a textarea with its rows when the field asks for one', () => {
    const wrapper = mountField({ textarea: true, rows: 5 })

    expect(wrapper.get('textarea#field').attributes('rows')).toBe('5')
  })

  test('renders a small input, and leaves the textarea at Bootstrap\'s default size', () => {
    const input = mountField()
    const textarea = mountField({ textarea: true })

    expect(input.get('#field').classes()).toContain('form-control-sm')
    expect(textarea.get('#field').classes()).not.toContain('form-control-sm')
  })
})
