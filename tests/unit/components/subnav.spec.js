import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import SubNav from '@/components/SubNav'


describe('SubNav.vue', () => {
  test('exists', () => {
    const wrapper = shallowMount(SubNav)
    const subnav = wrapper.findComponent({ ref: 'page-subnav' })
    expect(subnav.exists()).to.be.true
  })
})
