import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import TheAppLayout from '@/components/TheAppLayout'
import my24 from "@/services/my24"

const router = new VueRouter()


describe('TheAppLayout.vue', () => {
  test('exists', async () => {
    const wrapper = shallowMount(TheAppLayout, {
      router,
      mocks: {
        $trans: (t) => t
      }
    })

    await flushPromises()

    const el = wrapper.findComponent(TheAppLayout)
    expect(el.exists()).to.be.true
  })

  test('contains Nav and SubNav', async () => {
    const wrapper = shallowMount(TheAppLayout, {
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
