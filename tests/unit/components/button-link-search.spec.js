import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import ButtonLinkSearch from '@/components/ButtonLinkSearch'

describe('ButtonLinkSearch.vue', () => {
  test('exists',() => {
    const wrapper = shallowMount(ButtonLinkSearch,{
      mocks: {
        $trans: () => {}
      }
    })

    const el = wrapper.findComponent(ButtonLinkSearch)
    expect(el.exists()).to.be.true
  })

})
