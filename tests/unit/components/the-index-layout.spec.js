import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'

import TheIndexLayout from '@/components/TheIndexLayout.vue'
import localVue from '../index'


describe('TheIndexLayout.vue', () => {
  it('exists', () => {
    const wrapper = shallowMount(TheIndexLayout, {
      localVue,
    })

    const container = wrapper.findComponent({ ref: 'index-layout' })
    expect(container.exists()).to.be.true
  })
})
