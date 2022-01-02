import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import ModuleForm from '@/views/member/ModuleForm.vue'
import moduleResponse from '../../fixtures/contract'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/member/module/1/':
      return Promise.resolve(moduleResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('ModuleForm.vue', () => {
  it('exists', async () => {
    const wrapper = shallowMount(ModuleForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ModuleForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New module"', async () => {
    const wrapper = mount(ModuleForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New module</h2>')
  })

  it('edit, contains "Edit module"', async () => {
    const wrapper = mount(ModuleForm, {
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
    expect(html).to.contain('<h2>Edit module</h2>')
  })
})
