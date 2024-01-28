import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ButtonLinkSort from '@/components/ButtonLinkSort'

describe('ButtonLinkSort.vue', () => {
  test('exists',() => {
    const wrapper = shallowMount(ButtonLinkSort,{
      mocks: {
        $trans: () => {}
      }
    })

    let el = wrapper.findComponent(ButtonLinkSort)
    expect(el.exists()).to.be.true
  })

})
