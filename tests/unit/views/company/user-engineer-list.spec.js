import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'
import Vuex from "vuex"

import UserEngineerList from '../../../../src/views/company/UserEngineerList.vue'
import userEngineerResponse from '../../fixtures/user-engineers'
import my24 from "../../../../src/services/my24";

vi.mock('axios')

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

const resultCertainModules = {
  'userInfo': {
    "member_contract": "company:activity,company|mobile:assigned-finished,dispatch,orders|orders:orders,orders-not-accepted"
  }
}

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
      state: {
        memberContract: my24.getModelsFromString(resultCertainModules.userInfo.member_contract),
        userInfo: {
          pk: 1,
          is_staff: true,
          customer_user: null,
        }
      }
    })
  })

  test('exists', async () => {
    axios.get.mockResolvedValue(userEngineerResponse);

    const wrapper = shallowMount(UserEngineerList, {
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

  test('has two rows', async () => {
    axios.get.mockResolvedValue(userEngineerResponse);

    const wrapper = mount(UserEngineerList, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#engineer-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValue(userEngineerResponse);

    const wrapper = mount(UserEngineerList, {
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
