import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import localVue from '../index'
import ButtonLinkSort from '@/components/ButtonLinkSort'

describe('ButtonLinkSort.vue', () => {
  it('exists',() => {
    const wrapper = shallowMount(ButtonLinkSort,{
      localVue,
      mocks: {
        $trans: () => {}
      }
    })

    let el = wrapper.findComponent(ButtonLinkSort)
    expect(el.exists()).to.be.true
  })

})
