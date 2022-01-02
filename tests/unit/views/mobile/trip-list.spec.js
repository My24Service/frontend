import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import TripList from '@/views/mobile/TripList.vue'
import tripsResponse from '../../fixtures/trips'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'mobile-trips-add'
},
{
  path: '/hello/world',
  name: 'mobile-trips-edit'
},
]

const router = new VueRouter({routes})


describe('TripList.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(tripsResponse);

    const wrapper = shallowMount(TripList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(TripList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(tripsResponse);

    const wrapper = mount(TripList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#trip-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(tripsResponse);

    const wrapper = mount(TripList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('test')
    expect(html).to.contain('test 2')
  })
})
