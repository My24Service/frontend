import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import TheAppLayout from '@/components/TheAppLayout'
import localVue from '../index'
import my24 from "@/services/my24"

const router = new VueRouter()


describe('TheAppLayout.vue', () => {
  it('exists', async () => {
    const wrapper = shallowMount(TheAppLayout, {
      localVue,
      router,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const el = wrapper.findComponent(TheAppLayout)
    expect(el.exists()).to.be.true
  })

  it('contains Nav and SubNav', async () => {
    const wrapper = shallowMount(TheAppLayout, {
      localVue,
      router,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const container = wrapper.findComponent({ref: 'app-layout'})
    expect(container.exists()).to.be.true
  })

})
