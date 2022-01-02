import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import localVue from '../../index'
import PartnerRequestsSentList from '@/views/company/PartnerRequestsSentList'
import partnerRequestsSentResponse from '../../fixtures/partner-requests-sent'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'partner-request-add'
},
]

const router = new VueRouter({routes})


describe('PartnerRequestsSentList.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(partnerRequestsSentResponse);

    const wrapper = shallowMount(PartnerRequestsSentList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PartnerRequestsSentList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(partnerRequestsSentResponse);

    const wrapper = mount(PartnerRequestsSentList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#partnerRequestsSent-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(partnerRequestsSentResponse);

    const wrapper = mount(PartnerRequestsSentList, {
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
