import { afterEach, describe, expect, test } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

import ValidatedFormField from '@/features/forms/ValidatedFormField.vue'

enableAutoUnmount(afterEach)

/**
 * The shared \`BFormGroup + input + feedback\` field the forms repeat. The member
 * form and the two account forms adopt it, so what it renders *is* their
 * rendering: a stacked label unless the caller asks for label columns, the hint
 * copy while the field sits untouched, and the error copy - with \`d-block\` -
 * once the form has been submitted.
 */

function mountField(props = {}, slots = {}) {
  return mount(ValidatedFormField, {
    props: { id: 'field', label: 'Name', modelValue: '', ...props },
    slots,
  })
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

    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['SHLTR'])
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
