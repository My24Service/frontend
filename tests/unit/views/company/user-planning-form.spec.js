import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import UserPlanningForm from '@/views/company/UserPlanningForm.vue'
import userPlanningResponse from '../../fixtures/user-planning'

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/company/planninguser/1/':
      return Promise.resolve(userPlanningResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('UserPlanningForm.vue', () => {
  test('exists', async () => {
    const wrapper = shallowMount(UserPlanningForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(UserPlanningForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New planning user"', async () => {
    const wrapper = mount(UserPlanningForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New planning user</h2>')
  })

  test('edit, contains "Edit planning user"', async () => {
    const wrapper = mount(UserPlanningForm, {
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit planning user</h2>')
  })
})
