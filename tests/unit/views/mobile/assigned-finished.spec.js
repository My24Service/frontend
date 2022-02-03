import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'
const moment = require('moment')
import Vuex from 'vuex'

import localVue from '../../index'
import AssignedFinished from '@/views/mobile/AssignedFinished.vue'
import asssignedFisnihedResponse from '../../fixtures/assigned-finished'

jest.mock('axios')

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

  it('exists', async () => {
    axios.get.mockResolvedValueOnce(asssignedFisnihedResponse);

    const wrapper = mount(AssignedFinished, {
      localVue,
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

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(asssignedFisnihedResponse);

    const wrapper = mount(AssignedFinished, {
      localVue,
      router,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#assigned-finished-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "Duyvis Production B.V."', async () => {
    axios.get.mockResolvedValueOnce(asssignedFisnihedResponse);

    const wrapper = mount(AssignedFinished, {
      localVue,
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
