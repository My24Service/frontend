import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import localVue from '../index'
import ButtonLinkDownload from '@/components/ButtonLinkDownload'

describe('ButtonLinkDownload.vue', () => {
  it('exists',() => {
    const wrapper = shallowMount(ButtonLinkDownload,{
      localVue,
      mocks: {
        $trans: () => {}
      }
    })

    const el = wrapper.findComponent(ButtonLinkDownload)
    expect(el.exists()).to.be.true
  })

})
