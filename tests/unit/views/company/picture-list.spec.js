import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import PictureList from '@/views/company/PictureList.vue'
import picturesResponse from '../../fixtures/pictures'

vi.mock('axios')

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
  test('exists', async () => {
    axios.get.mockResolvedValue(picturesResponse);

    const wrapper = shallowMount(PictureList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PictureList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(picturesResponse);

    const wrapper = mount(PictureList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#picture-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValue(picturesResponse);

    const wrapper = mount(PictureList, {
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
