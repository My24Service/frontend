import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import StatuscodeForm from '@/views/shared/StatuscodeForm.vue'
import statuscodeResponse from '../../fixtures/statuscode'

jest.mock('axios')


describe('StatuscodeForm.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(statuscodeResponse);

    const wrapper = shallowMount(StatuscodeForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'order',
      },
      stubs: ['color-picker']
    })

    await flushPromises()

    const el = wrapper.findComponent(StatuscodeForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New statuscode"', async () => {
    axios.get.mockResolvedValueOnce(statuscodeResponse);

    const wrapper = mount(StatuscodeForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'order',
      },
      stubs: ['color-picker']
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New statuscode</h2>')
  })

  it('edit, contains "Edit statuscode"', async () => {
    axios.get.mockResolvedValueOnce(statuscodeResponse);

    const wrapper = mount(StatuscodeForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1,
        list_type: 'order'
      },
      stubs: ['color-picker']
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit statuscode</h2>')
  })

  it('contains "Start order?" - order', async () => {
    axios.get.mockResolvedValueOnce(statuscodeResponse);

    const wrapper = mount(StatuscodeForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1,
        list_type: 'order'
      },
      stubs: ['color-picker']
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Start order?')
  })

  it('doesn not contain "Start trip?" - order', async () => {
    axios.get.mockResolvedValueOnce(statuscodeResponse);

    const wrapper = mount(StatuscodeForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1,
        list_type: 'order'
      },
      stubs: ['color-picker']
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Start trip?')
  })
})
