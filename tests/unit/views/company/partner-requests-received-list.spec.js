import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import localVue from '../../index'
import PartnerRequestsReceivedList from '@/views/company/PartnerRequestsReceivedList'
import partnerRequestsReceivedResponse from '../../fixtures/partner-requests-received'

jest.mock('axios')

const router = new VueRouter({routes: []})


describe('PartnerRequestsReceivedList.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(partnerRequestsReceivedResponse);

    const wrapper = shallowMount(PartnerRequestsReceivedList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PartnerRequestsReceivedList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(partnerRequestsReceivedResponse);

    const wrapper = mount(PartnerRequestsReceivedList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#partnerRequestsReceived-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(partnerRequestsReceivedResponse);

    const wrapper = mount(PartnerRequestsReceivedList, {
      localVue,
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
