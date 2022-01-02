import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import ModulePartForm from '@/views/member/ModulePartForm.vue'
import modulePartResponse from '../../fixtures/module-parts'
import moduleResponse from '../../fixtures/modules'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/member/module/?page=1':
      return Promise.resolve(moduleResponse)
    case '/member/module-part/1/':
      return Promise.resolve(modulePartResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('ModulePartForm.vue', () => {
  it('exists', async () => {
    const wrapper = shallowMount(ModulePartForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ModulePartForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New module part"', async () => {
    const wrapper = mount(ModulePartForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New module part</h2>')
  })

  it('edit, contains "Edit module part"', async () => {
    const wrapper = mount(ModulePartForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit module part</h2>')
  })
})
