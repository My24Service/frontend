import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'
import Vuex from "vuex";

import MemberList from '@/views/member/MemberList.vue'
import memberResponse from '../../fixtures/contracts'

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'member-add'
},
{
  path: '/hello/world',
  name: 'member-edit'
},
]

const router = new VueRouter({routes})


describe('MemberList.vue', () => {
  let store
  let actions
  let getters

  beforeEach(() => {
    getters = {
    }

    actions = {
    }

    store = new Vuex.Store({
      actions,
      getters,
      state: {
        userInfo: {
          pk: 1,
          is_staff: true,
          customer_user: null
        }
      }
    })
  })

  test('exists', async () => {
    axios.get.mockResolvedValue(memberResponse);

    const wrapper = shallowMount(MemberList, {
      router,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(MemberList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(memberResponse);

    const wrapper = mount(MemberList, {
      router,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#member-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValue(memberResponse);

    const wrapper = mount(MemberList, {
      router,
      store,
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
