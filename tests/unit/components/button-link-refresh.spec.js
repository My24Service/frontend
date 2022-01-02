import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import localVue from '../index'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh'

function HelloWorld() {}

describe('ButtonLinkRefresh.vue', () => {
  it('exists',() => {
    const wrapper = shallowMount(ButtonLinkRefresh,{
      localVue,
      propsData: {
        method: HelloWorld,
        title: 'Hello world refresh'
      }
    })

    const el = wrapper.findComponent(ButtonLinkRefresh)
    expect(el.exists()).to.be.true
  })
})
