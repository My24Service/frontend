import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import ResetPasswordConfirm from '@/views/account/ResetPasswordConfirm.vue'


describe('ResetPasswordConfirm.vue', () => {
  it('exists', async () => {
    const wrapper = shallowMount(ResetPasswordConfirm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ResetPasswordConfirm)
    expect(el.exists()).to.be.true
  })

})
