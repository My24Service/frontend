import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from "vuex"

import MemberForm from '@/views/member/MemberForm.vue'
import memberResponse from '../../fixtures/contract'
import contractsResponse from '../../fixtures/contracts'

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/member/contract/?page=1':
      return Promise.resolve(contractsResponse)
    case '/member/member/1/':
      return Promise.resolve(memberResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('MemberForm.vue', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getCountries: () => [],
    }

    store = new Vuex.Store({
      actions,
    })
  })

  test('exists', async () => {
    const wrapper = shallowMount(MemberForm, {
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(MemberForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New member"', async () => {
    const wrapper = mount(MemberForm, {
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('New member</h2>')
  })

  test('edit, contains "Edit member"', async () => {
    const wrapper = mount(MemberForm, {
      store,
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Edit member</h2>')
  })
})
