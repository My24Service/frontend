import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from "vuex"

import localVue from '../../index'
import UserStudentForm from '@/views/company/UserStudentForm.vue'
import userStudentResponse from '../../fixtures/user-student'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/company/studentuser/1/':
      return Promise.resolve(userStudentResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('UserStudentForm.vue', () => {
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

  it('exists', async () => {
    const wrapper = shallowMount(UserStudentForm, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(UserStudentForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New student user"', async () => {
    const wrapper = mount(UserStudentForm, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New student user</h2>')
  })

  it('edit, contains "Edit student user"', async () => {
    const wrapper = mount(UserStudentForm, {
      localVue,
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
    expect(html).to.contain('<h2>Edit student user</h2>')
  })
})
