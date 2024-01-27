import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import IconLinkDelete from '@/components/IconLinkDelete'

function HelloWorld() {}

describe('IconLinkDelete.vue', () => {
  test('exists',() => {
    const wrapper = shallowMount(IconLinkDelete,{
      propsData: {
        method: HelloWorld,
        title: 'Hello world'
      }
    })

    const el = wrapper.findComponent(IconLinkDelete)
    expect(el.exists()).to.be.true
  })

  test('renders', async () => {
    const wrapper = await render(IconLinkDelete,{
      propsData: {
        method: HelloWorld,
        title: 'Hello world delete'
      },
    })

    expect(wrapper.html()).to.contain('<a title="Hello world delete" href="#"')
  })
})
