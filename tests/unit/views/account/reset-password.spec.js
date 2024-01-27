import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import ResetPassword from '@/views/account/ResetPassword.vue'


describe('ResetPassword.vue', () => {
  test('exists', async () => {
    const wrapper = shallowMount(ResetPassword, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ResetPassword)
    expect(el.exists()).to.be.true
  })

})
