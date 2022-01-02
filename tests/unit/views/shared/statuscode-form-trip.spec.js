import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import StatuscodeForm from '@/views/shared/StatuscodeForm.vue'
import statuscodeResponse from '../../fixtures/trip-statuscode'

jest.mock('axios')


describe('StatuscodeForm.vue - trip', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(statuscodeResponse);

    const wrapper = shallowMount(StatuscodeForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'trip',
      },
      stubs: ['color-picker']
    })

    await flushPromises()

    const el = wrapper.findComponent(StatuscodeForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New statuscode" - trip', async () => {
    axios.get.mockResolvedValueOnce(statuscodeResponse);

    const wrapper = mount(StatuscodeForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'trip',
      },
      stubs: ['color-picker']
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New statuscode</h2>')
  })

  it('edit, contains "Edit statuscode" - trip', async () => {
    axios.get.mockResolvedValueOnce(statuscodeResponse);

    const wrapper = mount(StatuscodeForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1,
        list_type: 'trip'
      },
      stubs: ['color-picker']
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit statuscode</h2>')
  })

  it('does not contain "Start order?" - trip', async () => {
    axios.get.mockResolvedValueOnce(statuscodeResponse);

    const wrapper = mount(StatuscodeForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1,
        list_type: 'trip'
      },
      stubs: ['color-picker']
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Start order?')
  })

  it('contains "Start trip?" - trip', async () => {
    axios.get.mockResolvedValueOnce(statuscodeResponse);

    const wrapper = mount(StatuscodeForm, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1,
        list_type: 'trip'
      },
      stubs: ['color-picker']
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Start trip?')
  })
})
