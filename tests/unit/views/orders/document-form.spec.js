import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { describe, expect, vi, test } from 'vitest'
import axios from "axios"

import DocumentForm from '@/views/orders/DocumentForm.vue'
import documentResponse from '../../fixtures/document'

vi.mock('axios')


describe('DocumentForm.vue', () => {
  beforeEach(() => {
    axios.get.mockReset()
  })

  test('exists', async () => {
    axios.get.mockResolvedValue(documentResponse);

    const wrapper = shallowMount(DocumentForm, {
      // localVue,
      mocks: {
        $trans: (f) => f
      },
      stubs: ['color-picker']
    })

    await flushPromises()

    const el = wrapper.findComponent(DocumentForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New document"', async () => {
    axios.get.mockResolvedValue(documentResponse);

    const wrapper = mount(DocumentForm, {
      // localVue,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New document</h2>')
  })

  test('edit, contains "Edit document"', async () => {
    axios.get.mockResolvedValue(documentResponse);

    const wrapper = mount(DocumentForm, {
      // localVue,
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
