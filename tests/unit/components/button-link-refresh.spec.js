import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh'

function HelloWorld() {}

describe('ButtonLinkRefresh.vue', () => {
  test('exists',() => {
    const wrapper = shallowMount(ButtonLinkRefresh,{
      propsData: {
        method: HelloWorld,
        title: 'Hello world refresh'
      }
    })

    const el = wrapper.findComponent(ButtonLinkRefresh)
    expect(el.exists()).to.be.true
  })
})
