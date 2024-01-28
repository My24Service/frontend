import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import PartnerRequestsSentList from '@/views/company/PartnerRequestsSentList'
import partnerRequestsSentResponse from '../../fixtures/partner-requests-sent'

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'partner-request-add'
},
]

const router = new VueRouter({routes})

describe('PartnerRequestsSentList.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(partnerRequestsSentResponse);

    const wrapper = shallowMount(PartnerRequestsSentList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PartnerRequestsSentList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(partnerRequestsSentResponse);

    const wrapper = mount(PartnerRequestsSentList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#partnerRequestsSent-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValue(partnerRequestsSentResponse);

    const wrapper = mount(PartnerRequestsSentList, {
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
