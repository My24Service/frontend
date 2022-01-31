import axios from 'axios'
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import ActivityList from '@/views/company/ActivityList.vue'
import activityResponse from '../../fixtures/activity'


describe('ActivityList.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(activityResponse);

    const wrapper = shallowMount(ActivityList, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ActivityList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(activityResponse);

    const wrapper = mount(ActivityList, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#activity-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(activityResponse);

    const wrapper = mount(ActivityList, {
      localVue,
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
