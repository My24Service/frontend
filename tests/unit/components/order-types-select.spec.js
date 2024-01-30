import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import flushPromises from 'flush-promises'

import OrderTypesSelect from '@/components/OrderTypesSelect.vue'


describe('OrderTypesSelect.vue', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getOrderTypes: () => [
        "RK1 Comet",
        "RK2 Santa",
        "RK3 Uitgifte",
        "RK4 Uitgifte"
      ]
    }

    store = new Vuex.Store({
      actions
    })
  })

  test('exists', () => {
    const wrapper = shallowMount(OrderTypesSelect, {
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    const el = wrapper.findComponent(OrderTypesSelect)
    expect(el.exists()).to.be.true
  })

  test('has includeAll', async () => {
    const wrapper = shallowMount(OrderTypesSelect, {
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        includeAll: true
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('all')
  })
})
