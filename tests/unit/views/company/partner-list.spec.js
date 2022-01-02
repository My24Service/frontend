import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import localVue from '../../index'
import PartnerList from '@/views/company/PartnerList.vue'
import partnersResponse from '../../fixtures/partners'

jest.mock('axios')

const router = new VueRouter({routes: []})


describe('PartnerList.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(partnersResponse);

    const wrapper = shallowMount(PartnerList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PartnerList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(partnersResponse);

    const wrapper = mount(PartnerList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#partner-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(partnersResponse);

    const wrapper = mount(PartnerList, {
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
