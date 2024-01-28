import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import IconLinkAssign from '@/components/IconLinkAssign'

function HelloWorld() {}

describe('IconLinkAssign.vue', () => {
  test('exists',() => {
    const wrapper = shallowMount(IconLinkAssign,{
      propsData: {
        method: HelloWorld,
        title: 'Hello world'
      }
    })

    const el = wrapper.findComponent(IconLinkAssign)
    expect(el.exists()).to.be.true
  })

  test('renders', async () => {
    const wrapper = await render(IconLinkAssign,{
      propsData: {
        method: HelloWorld,
        title: 'Hello world assign'
      },
    })

    expect(wrapper.html()).to.contain('<a title="Hello world assign" href="#"')
  })
})
