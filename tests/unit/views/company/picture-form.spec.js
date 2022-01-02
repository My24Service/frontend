import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import PictureForm from '@/views/company/PictureForm.vue'
import pictureResponse from '../../fixtures/picture'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/company/picture/1/':
      return Promise.resolve(pictureResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('PictureForm.vue', () => {
  it('exists', async () => {
    const wrapper = shallowMount(PictureForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PictureForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New picture"', async () => {
    const wrapper = mount(PictureForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New picture</h2>')
  })

  it('edit, contains "Edit picture"', async () => {
    const wrapper = mount(PictureForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit picture</h2>')
  })
})
