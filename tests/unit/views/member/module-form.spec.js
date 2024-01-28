import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import ModuleForm from '@/views/member/ModuleForm.vue'
import moduleResponse from '../../fixtures/contract'

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/member/module/1/':
      return Promise.resolve(moduleResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('ModuleForm.vue', () => {
  test('exists', async () => {
    const wrapper = shallowMount(ModuleForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ModuleForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New module"', async () => {
    const wrapper = mount(ModuleForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('New module</h2>')
  })

  test('edit, contains "Edit module"', async () => {
    const wrapper = mount(ModuleForm, {
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Edit module</h2>')
  })
})
