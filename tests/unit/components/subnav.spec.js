import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'

import localVue from '../index'
import SubNav from '@/components/SubNav'


describe('SubNav.vue', () => {
  it('exists', () => {
    const wrapper = shallowMount(SubNav, {
      localVue
    })
    const subnav = wrapper.findComponent({ ref: 'page-subnav' })
    expect(subnav.exists()).to.be.true
  })
})
