import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'
import Vuex from "vuex"

import localVue from '../../index'
import UserPlanningList from '@/views/company/UserPlanningList.vue'
import userPlanningResponse from '../../fixtures/users-planning'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'planninguser-add'
},
{
  path: '/hello/world',
  name: 'planninguser-edit'
},
]

const router = new VueRouter({routes})


describe('UserPlanningList.vue', () => {
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
    axios.get.mockResolvedValueOnce(userPlanningResponse);

    const wrapper = shallowMount(UserPlanningList, {
      localVue,
      router,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(UserPlanningList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(userPlanningResponse);

    const wrapper = mount(UserPlanningList, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#planninguser-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(userPlanningResponse);

    const wrapper = mount(UserPlanningList, {
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
