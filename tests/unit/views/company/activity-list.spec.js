import axios from 'axios'
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import ActivityList from '@/views/company/ActivityList.vue'
import activityResponse from '../../fixtures/activity'

vi.mock('axios')

describe('ActivityList.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(activityResponse);

    const wrapper = shallowMount(ActivityList, {
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ActivityList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(activityResponse);

    const wrapper = mount(ActivityList, {
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#activity-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValue(activityResponse);

    const wrapper = mount(ActivityList, {
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Test')
    expect(html).to.contain('Test 2')
  })
})
