import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import ButtonLinkDownload from '@/components/ButtonLinkDownload'

describe('ButtonLinkDownload.vue', () => {
  test('exists',() => {
    const wrapper = shallowMount(ButtonLinkDownload,{
      mocks: {
        $trans: () => {}
      }
    })

    const el = wrapper.findComponent(ButtonLinkDownload)
    expect(el.exists()).to.be.true
  })

})
