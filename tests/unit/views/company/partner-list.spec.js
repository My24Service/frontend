import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import PartnerList from '@/views/company/PartnerList.vue'
import partnersResponse from '../../fixtures/partners'

vi.mock('axios')

const router = new VueRouter({routes: []})

describe('PartnerList.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(partnersResponse);

    const wrapper = shallowMount(PartnerList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PartnerList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(partnersResponse);

    const wrapper = mount(PartnerList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#partner-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValue(partnersResponse);

    const wrapper = mount(PartnerList, {
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
