import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import ModulePartForm from '@/views/member/ModulePartForm.vue'
import modulePartResponse from '../../fixtures/module-parts'
import moduleResponse from '../../fixtures/modules'

vi.mock('axios')

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
  test('exists', async () => {
    const wrapper = shallowMount(ModulePartForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ModulePartForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New module part"', async () => {
    const wrapper = mount(ModulePartForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('New module part</h2>')
  })

  test('edit, contains "Edit module part"', async () => {
    const wrapper = mount(ModulePartForm, {
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Edit module part</h2>')
  })
})
