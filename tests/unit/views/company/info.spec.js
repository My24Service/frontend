import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex'

import localVue from '../../index'
import Info from '@/views/company/Info.vue'
import infoResponse from '../../fixtures/info'

jest.mock('axios')


describe('Info.vue', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getCountries: () => [],
    }

    store = new Vuex.Store({
      actions,
    })
  })

  it('exists', async () => {
    axios.get.mockResolvedValueOnce(infoResponse);

    const wrapper = shallowMount(Info, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(Info)
    expect(el.exists()).to.be.true
  })

})
