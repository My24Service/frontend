import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import ActionForm from '@/views/shared/ActionForm.vue'
import actionResponse from '../../fixtures/trip-statuscode-action'

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/mobile/trip-statuscode-action/1/':
      return Promise.resolve(actionResponse)
    default:
      console.log(url)
      return Promise.reject(new Error('not found'))
  }
})


describe('ActionForm.vue - trip', () => {
  test('exists', async () => {
    const wrapper = shallowMount(ActionForm, {
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'trip',
      }
    })

    await flushPromises()

    const el = wrapper.findComponent(ActionForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New action" - trip', async () => {
    const wrapper = mount(ActionForm, {
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'trip',
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New action</h2>')
  })

  test('edit, contains "Edit action" - trip', async () => {
    const wrapper = mount(ActionForm, {
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1,
        list_type: 'trip'
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit action</h2>')
  })
})
