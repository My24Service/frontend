import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import localVue from '../index'
import IconLinkAssign from '@/components/IconLinkAssign'

function HelloWorld() {}

describe('IconLinkAssign.vue', () => {
  it('exists',() => {
    const wrapper = shallowMount(IconLinkAssign,{
      localVue,
      propsData: {
        method: HelloWorld,
        title: 'Hello world'
      }
    })

    const el = wrapper.findComponent(IconLinkAssign)
    expect(el.exists()).to.be.true
  })

  it('renders', async () => {
    const wrapper = await render(IconLinkAssign,{
      localVue,
      propsData: {
        method: HelloWorld,
        title: 'Hello world assign'
      },
    })

    expect(wrapper.html()).to.contain('<a title="Hello world assign" href="#"')
  })
})
