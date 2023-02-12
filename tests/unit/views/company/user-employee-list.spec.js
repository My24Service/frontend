import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'
import Vuex from "vuex"

import localVue from '../../index'
import UserEmployeeList from '../../../../src/views/company/UserEmployeeList.vue'
import usersEmployeeResponse from '../../fixtures/users-employee'
import my24 from "../../../../src/services/my24";

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'employeeuser-add'
},
{
  path: '/hello/world',
  name: 'employeeuser-edit'
},
]

const resultCertainModules = {
  'userInfo': {
    "member_contract": "company:activity,company|mobile:assigned-finished,dispatch,orders|orders:orders,orders-not-accepted"
  }
}

const router = new VueRouter({routes})


describe('UserEmployeeList.vue', () => {
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

  it('exists', async () => {
    axios.get.mockResolvedValueOnce(usersEmployeeResponse);

    const wrapper = shallowMount(UserEmployeeList, {
      localVue,
      router,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(UserEmployeeList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(usersEmployeeResponse);

    const wrapper = mount(UserEmployeeList, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#employee-table > tbody > tr')
    expect(trs.length).to.equal(1)
  })

  it('contains "Hoi""', async () => {
    axios.get.mockResolvedValueOnce(usersEmployeeResponse);

    const wrapper = mount(UserEmployeeList, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Hoi')
  })
})
