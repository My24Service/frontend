import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import localVue from '../../index'
import PictureList from '@/views/company/PictureList.vue'
import picturesResponse from '../../fixtures/pictures'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'company-picture-add'
},
{
  path: '/hello/world',
  name: 'company-picture-edit'
},
]

const router = new VueRouter({routes})


describe('PictureList.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(picturesResponse);

    const wrapper = shallowMount(PictureList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PictureList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(picturesResponse);

    const wrapper = mount(PictureList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#picture-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(picturesResponse);

    const wrapper = mount(PictureList, {
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
