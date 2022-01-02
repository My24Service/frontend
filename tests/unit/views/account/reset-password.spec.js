import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import ResetPassword from '@/views/account/ResetPassword.vue'


describe('ResetPassword.vue', () => {
  it('exists', async () => {
    const wrapper = shallowMount(ResetPassword, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ResetPassword)
    expect(el.exists()).to.be.true
  })

})
