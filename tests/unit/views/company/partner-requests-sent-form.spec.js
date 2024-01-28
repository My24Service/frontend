import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import PartnerRequestsSentForm from '@/views/company/PartnerRequestsSentForm.vue'
import membersResponse from '../../fixtures/members-for-partner-select'

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/member/member/get_for_partner_select/?q=':
      return Promise.resolve(membersResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('PartnerRequestsSentForm.vue', () => {
  test('exists', async () => {
    const wrapper = shallowMount(PartnerRequestsSentForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PartnerRequestsSentForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New partner request"', async () => {
    const wrapper = mount(PartnerRequestsSentForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New partner request</h2>')
  })

})
