import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import localVue from '../index'
import ButtonLinkSearch from '@/components/ButtonLinkSearch'

describe('ButtonLinkSearch.vue', () => {
  it('exists',() => {
    const wrapper = shallowMount(ButtonLinkSearch,{
      localVue,
      mocks: {
        $trans: () => {}
      }
    })

    const el = wrapper.findComponent(ButtonLinkSearch)
    expect(el.exists()).to.be.true
  })

})
