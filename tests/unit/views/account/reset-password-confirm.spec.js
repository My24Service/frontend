import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import ResetPasswordConfirm from '@/views/account/ResetPasswordConfirm.vue'


describe('ResetPasswordConfirm.vue', () => {
  test('exists', async () => {
    const wrapper = shallowMount(ResetPasswordConfirm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ResetPasswordConfirm)
    expect(el.exists()).to.be.true
  })

})
