import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import SubNavMobile from '@/components/SubNavMobile'
import localVue from '../index'
import my24 from "@/services/my24"

const memberContract = "mobile:assigned-finished,dispatch,orders,orders-finished,orders-in-progress,trips"

const router = new VueRouter()


describe('SubNavMobile.vue maintenance', () => {
  let state
  let store
  let actions

  beforeEach(() => {
    actions = {
      getMemberType: () => 'maintenance'
    }

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
    const wrapper = shallowMount(SubNavMobile, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent(SubNavMobile)
    expect(navbar.exists()).to.be.true
  })

  it('contains Assigned finished, Dispatch', async () => {
    const wrapper = shallowMount(SubNavMobile, {
      localVue,
      router,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Assigned finished')
    expect(html).to.contain('Dispatch')
  })

  it('does not contain Trips, Timesheet', async () => {
    const wrapper = shallowMount(SubNavMobile, {
      localVue,
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Trips')
    expect(html).not.to.contain('Timesheet')
  })

})

describe('SubNavMobile.vue temps', () => {
  let state
  let store
  let actions

  beforeEach(() => {
    actions = {
      getMemberType: () => 'temps'
    }

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
    const wrapper = shallowMount(SubNavMobile, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent(SubNavMobile)
    expect(navbar.exists()).to.be.true
  })

  it('contains Assigned finished, Dispatch, Trips', async () => {
    const wrapper = shallowMount(SubNavMobile, {
      localVue,
      router,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Assigned finished')
    expect(html).to.contain('Dispatch')
    expect(html).to.contain('Trips')
  })

  it('does not contain Timesheet', async () => {
    const wrapper = shallowMount(SubNavMobile, {
      localVue,
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Timesheet')
  })

})
