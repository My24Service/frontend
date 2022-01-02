import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import localVue from '../index'
import IconLinkDelete from '@/components/IconLinkDelete'

function HelloWorld() {}

describe('IconLinkDelete.vue', () => {
  it('exists',() => {
    const wrapper = shallowMount(IconLinkDelete,{
      localVue,
      propsData: {
        method: HelloWorld,
        title: 'Hello world'
      }
    })

    const el = wrapper.findComponent(IconLinkDelete)
    expect(el.exists()).to.be.true
  })

  it('renders', async () => {
    const wrapper = await render(IconLinkDelete,{
      localVue,
      propsData: {
        method: HelloWorld,
        title: 'Hello world delete'
      },
    })

    expect(wrapper.html()).to.contain('<a title="Hello world delete" href="#"')
  })
})
