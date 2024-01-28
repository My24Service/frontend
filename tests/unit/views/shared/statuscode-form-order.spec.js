import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import StatuscodeForm from '@/views/shared/StatuscodeForm.vue'
import statuscodeResponse from '../../fixtures/statuscode'

vi.mock('axios')


describe('StatuscodeForm.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(statuscodeResponse);

    const wrapper = shallowMount(StatuscodeForm, {
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

  test('insert, contains "New statuscode"', async () => {
    axios.get.mockResolvedValue(statuscodeResponse);

    const wrapper = mount(StatuscodeForm, {
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

  test('edit, contains "Edit statuscode"', async () => {
    axios.get.mockResolvedValue(statuscodeResponse);

    const wrapper = mount(StatuscodeForm, {
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

  test('contains "Start order?" - order', async () => {
    axios.get.mockResolvedValue(statuscodeResponse);

    const wrapper = mount(StatuscodeForm, {
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

  test('doesn not contain "Start trip?" - order', async () => {
    axios.get.mockResolvedValue(statuscodeResponse);

    const wrapper = mount(StatuscodeForm, {
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
