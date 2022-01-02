import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import ActionForm from '@/views/shared/ActionForm.vue'
import actionResponse from '../../fixtures/action'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/order/action/1/':
      return Promise.resolve(actionResponse)
    case '/company/partner/?page=1':
      return Promise.resolve({data: {results: []}})
    default:
      console.log(url)
      return Promise.reject(new Error('not found'))
  }
})


describe('ActionForm.vue - order', () => {
  it('exists', async () => {
    const wrapper = shallowMount(ActionForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'order',
      }
    })

    await flushPromises()

    const el = wrapper.findComponent(ActionForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New action" - order', async () => {
    const wrapper = mount(ActionForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'order',
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New action</h2>')
  })

  it('edit, contains "Edit action" - order', async () => {
    const wrapper = mount(ActionForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1,
        list_type: 'order'
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit action</h2>')
  })
})
