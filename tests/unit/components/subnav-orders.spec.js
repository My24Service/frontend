import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import SubNavOrders from '@/components/SubNavOrders'
import my24 from "@/services/my24"

const memberContract = "orders:month-stats,orders,orders-not-accepted,past-orders,statuscodes"

const router = new VueRouter()


describe('SubNavOrders.vue planning', () => {
  let state
  let store

  beforeEach(() => {
    state = {
      memberContract: my24.getModelsFromString(memberContract),
      userInfo: {
        submodel: 'planning_user',
        user: {
          is_staff: false,
          is_superuser: false,
          planning_user: {}
        }
      }
    }

    store = new Vuex.Store({
      state,
    })
  })

  test('exists', async () => {
    const wrapper = shallowMount(SubNavOrders, {
      store,
      router,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent(SubNavOrders)
    expect(navbar.exists()).to.be.true
  })

  test('contains Month, Not accepted orders, Past orders', async () => {
    const wrapper = shallowMount(SubNavOrders, {
      router,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Month')
    expect(html).to.contain('Not accepted orders')
    expect(html).to.contain('Past orders')
  })

  test('does not contain Year, Workorder orders', async () => {
    const wrapper = shallowMount(SubNavOrders, {
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Year')
    expect(html).not.to.contain('Workorder orders')
  })

})

describe('SubNavOrders.vue customer', () => {
  let state
  let store

  beforeEach(() => {
    state = {
      memberContract: my24.getModelsFromString(memberContract),
      userInfo: {
        submodel: 'customer_user',
        user: {
          is_staff: false,
          is_superuser: false,
          customer_user: {}
        }
      }
    }

    store = new Vuex.Store({
      state,
    })
  })

  test('exists', async () => {
    const wrapper = shallowMount(SubNavOrders, {
      store,
      router,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent(SubNavOrders)
    expect(navbar.exists()).to.be.true
  })

  test('contains Orders', async () => {
    const wrapper = shallowMount(SubNavOrders, {
      router,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Orders')
  })

  test('does not contain Year, Workorder orders', async () => {
    const wrapper = shallowMount(SubNavOrders, {
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Year')
    expect(html).not.to.contain('Workorder orders')
  })

})

describe('SubNavOrders.vue branch employee', () => {
  let state
  let store

  beforeEach(() => {
    state = {
      memberContract: my24.getModelsFromString(memberContract),
      userInfo: {
        submodel: 'employee_user',
        user: {
          is_staff: false,
          is_superuser: false,
          employee_user: {
            branch: 1
          }
        }
      }
    }

    store = new Vuex.Store({
      state,
    })
  })

  test('exists', async () => {
    const wrapper = shallowMount(SubNavOrders, {
      store,
      router,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent(SubNavOrders)
    expect(navbar.exists()).to.be.true
  })

  test('contains Orders', async () => {
    const wrapper = shallowMount(SubNavOrders, {
      router,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Orders')
  })

  test('does not contain Year, Workorder orders', async () => {
    const wrapper = shallowMount(SubNavOrders, {
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Year')
    expect(html).not.to.contain('Workorder orders')
  })

})
