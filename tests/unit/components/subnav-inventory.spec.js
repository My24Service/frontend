import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import SubNavInventory from '@/components/SubNavInventory'
import my24 from "@/services/my24"

const memberContract = "inventory:materials,move-material,mutations,stats,stock-locations"

const router = new VueRouter()


describe('SubNavInventory.vue', () => {
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

  test('exists', async () => {
    const wrapper = shallowMount(SubNavInventory, {
      store,
      router,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent(SubNavInventory)
    expect(navbar.exists()).to.be.true
  })

  test('contains Materials, Move, Statistics', async () => {
    const wrapper = await render(SubNavInventory, {
      router,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Materials')
    expect(html).to.contain('Move')
    expect(html).to.contain('Statistics')
  })

  test('does not contain Suppliers', async () => {
    const wrapper = await render(SubNavInventory, {
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Suppliers')
  })

})
