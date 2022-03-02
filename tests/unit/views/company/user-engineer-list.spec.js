import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'
import Vuex from "vuex"

import localVue from '../../index'
import UserEngineerList from '@/views/company/UserEngineerList.vue'
import userEngineerResponse from '../../fixtures/user-engineers'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'engineer-add'
},
{
  path: '/hello/world',
  name: 'engineer-edit'
},
  {
    path: '/bla/bla',
    name: 'engineer-detail'
  }
]

const router = new VueRouter({routes})


describe('UserEngineerList.vue', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getMemberType: () => 'maintenance',
    }

    store = new Vuex.Store({
      actions,
    })
  })

  it('exists', async () => {
    axios.get.mockResolvedValueOnce(userEngineerResponse);

    const wrapper = shallowMount(UserEngineerList, {
      localVue,
      router,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(UserEngineerList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(userEngineerResponse);

    const wrapper = mount(UserEngineerList, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#engineer-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(userEngineerResponse);

    const wrapper = mount(UserEngineerList, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Test')
    expect(html).to.contain('Test 2')
  })
})
