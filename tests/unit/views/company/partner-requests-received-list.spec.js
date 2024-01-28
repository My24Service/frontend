import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import PartnerRequestsReceivedList from '@/views/company/PartnerRequestsReceivedList'
import partnerRequestsReceivedResponse from '../../fixtures/partner-requests-received'

vi.mock('axios')

const router = new VueRouter({routes: []})

describe('PartnerRequestsReceivedList.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(partnerRequestsReceivedResponse);

    const wrapper = shallowMount(PartnerRequestsReceivedList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PartnerRequestsReceivedList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(partnerRequestsReceivedResponse);

    const wrapper = mount(PartnerRequestsReceivedList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#partnerRequestsReceived-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValue(partnerRequestsReceivedResponse);

    const wrapper = mount(PartnerRequestsReceivedList, {
      router,
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
