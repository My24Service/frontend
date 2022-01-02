import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import DocumentForm from '@/views/orders/DocumentForm.vue'
import documentResponse from '../../fixtures/document'

jest.mock('axios')


describe('DocumentForm.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(documentResponse);

    const wrapper = shallowMount(DocumentForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      stubs: ['color-picker']
    })

    await flushPromises()

    const el = wrapper.findComponent(DocumentForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New document"', async () => {
    axios.get.mockResolvedValueOnce(documentResponse);

    const wrapper = mount(DocumentForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New document</h2>')
  })

  it('edit, contains "Edit document"', async () => {
    axios.get.mockResolvedValueOnce(documentResponse);

    const wrapper = mount(DocumentForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit document</h2>')
  })
})
