import { describe, expect, test } from 'vitest'

import TimeInput from '@/views/mobile/TimeInput.vue'

import { mountForm } from '../../support/form-harness.js'

/**
 * Characterisation of the small time field the dispatch date modal uses,
 * written against the LEGACY component before it moves into
 * `src/features/field-service/dispatch/`.
 *
 * It is one input with one rule: a value is only handed on once it contains a
 * colon, and only the hour and minute survive. That rule is what keeps a
 * half-typed `08` from clearing the field.
 */
function mountTimeInput(props = {}) {
  return mountForm(TimeInput, {
    deep: true,
    props,
    main: {getCurrentLanguage: 'nl'},
    stubs: {VueDatePickerRoot: {template: '<div><slot name="trigger" /></div>'}},
  })
}

describe('TimeInput', () => {
  test('a time with seconds is cut back to HH:mm', () => {
    const wrapper = mountTimeInput({timeIn: '08:30:45'})

    expect(wrapper.vm.time).toBe('08:30')
  })

  test('a value without a colon is refused rather than rewritten', async () => {
    const wrapper = mountTimeInput()
    const input = wrapper.get('input.form-control')

    await input.setValue('08')

    expect(wrapper.emitted('timeChanged')).toBeUndefined()
  })

  test('a typed time is cleaned and handed to the parent', async () => {
    const wrapper = mountTimeInput()
    const input = wrapper.get('input.form-control')

    await input.setValue('08:30:45')

    expect(wrapper.emitted('timeChanged')).toEqual([['08:30']])
  })
})
