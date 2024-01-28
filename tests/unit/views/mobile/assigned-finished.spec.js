import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'
const moment = require('moment')
import Vuex from 'vuex'

import AssignedFinished from '@/views/mobile/AssignedFinished.vue'
import assignedFinishedResponse from '../../fixtures/assigned-finished'

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'order-view'
},
]

const router = new VueRouter({routes})


describe('AssignedFinished.vue', () => {
  let store
  let getters

  beforeEach(() => {
    getters = {
      isLoggedIn: () => true,
    }

    store = new Vuex.Store({
      getters,
    })
  })

  test('exists', async () => {
    axios.get.mockResolvedValue(assignedFinishedResponse);

    const wrapper = mount(AssignedFinished, {
      router,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(AssignedFinished)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(assignedFinishedResponse);

    const wrapper = mount(AssignedFinished, {
      router,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#assigned-finished-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "Duyvis Production B.V."', async () => {
    axios.get.mockResolvedValue(assignedFinishedResponse);

    const wrapper = mount(AssignedFinished, {
      router,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Duyvis Production B.V.')
  })

})
