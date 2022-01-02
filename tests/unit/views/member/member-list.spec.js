import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import localVue from '../../index'
import MemberList from '@/views/member/MemberList.vue'
import memberResponse from '../../fixtures/contracts'

jest.mock('axios')

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
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(memberResponse);

    const wrapper = shallowMount(MemberList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(MemberList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(memberResponse);

    const wrapper = mount(MemberList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#member-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(memberResponse);

    const wrapper = mount(MemberList, {
      localVue,
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
