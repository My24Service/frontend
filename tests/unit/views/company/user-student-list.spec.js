import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'
import Vuex from "vuex"

import UserStudentList from '@/views/company/UserStudentList.vue'
import userStudentResponse from '../../fixtures/users-student'
import my24 from "../../../../src/services/my24";

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'studentuser-add'
},
  {
    path: '/hello/world',
    name: 'studentuser-detail'
  },
{
  path: '/hello/world',
  name: 'studentuser-edit'
},
]

const resultCertainModules = {
  'userInfo': {
    "member_contract": "company:activity,company|mobile:assigned-finished,dispatch,orders|orders:orders,orders-not-accepted"
  }
}

const router = new VueRouter({routes})


describe('UserStudentList.vue', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getMemberType: () => 'temps',
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
    axios.get.mockResolvedValue(userStudentResponse);

    const wrapper = shallowMount(UserStudentList, {
      router,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(UserStudentList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(userStudentResponse);

    const wrapper = mount(UserStudentList, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#studentuser-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValue(userStudentResponse);

    const wrapper = mount(UserStudentList, {
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
