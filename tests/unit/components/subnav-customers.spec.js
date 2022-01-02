import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import SubNavCustomers from '@/components/SubNavCustomers'
import localVue from '../index'
import my24 from "@/services/my24"

const memberContract = "customers:all-maintenance-products,customers"

const router = new VueRouter()


describe('SubNavCustomers.vue', () => {
  let state
  let store
  let actions

  beforeEach(() => {
    state = {
      memberContract: my24.getModelsFromString(memberContract),
      userInfo: {
        is_staff: false,
        is_superuser: false
      }
    }

    store = new Vuex.Store({
      state,
      actions
    })
  })

  it('exists', async () => {
    const wrapper = shallowMount(SubNavCustomers, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent(SubNavCustomers)
    expect(navbar.exists()).to.be.true
  })

  it('contains Customers, All maintenance products', async () => {
    const wrapper = await render(SubNavCustomers, {
      localVue,
      router,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('All maintenance products')
    expect(html).to.contain('Customers')
  })

  it('does not contain "Maintenance orders/year"', async () => {
    const wrapper = await render(SubNavCustomers, {
      localVue,
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Maintenance orders/year')
  })

})
