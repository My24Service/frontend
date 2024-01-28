import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import TheIndexLayout from '@/components/TheIndexLayout.vue'


describe('TheIndexLayout.vue', () => {
  test('exists', () => {
    const wrapper = shallowMount(TheIndexLayout, {
    })

    const container = wrapper.findComponent({ ref: 'index-layout' })
    expect(container.exists()).to.be.true
  })
})
