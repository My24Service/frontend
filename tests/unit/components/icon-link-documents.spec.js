import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import VueRouter from 'vue-router'
import localVue from '../index'
import IconLinkDocuments from '@/components/IconLinkDocuments'

const routes = [{
  path: '/my/documents',
  name: 'my-documents'
}]

const router = new VueRouter({routes})

describe('IconLinkDocuments.vue', () => {
  it('exists',() => {
    const wrapper = shallowMount(IconLinkDocuments,{
      localVue,
      router,
      propsData: {
        router_name: 'my-documents',
        router_params: {my: 'documents'},
        title: 'Hello world documents'
      }
    })

    const el = wrapper.findComponent(IconLinkDocuments)
    expect(el.exists()).to.be.true
  })

  it('renders', async () => {
    const wrapper = await render(IconLinkDocuments,{
      localVue,
      router,
      propsData: {
        router_name: 'my-documents',
        router_params: {my: 'documents'},
        title: 'Hello world documents'
      },
    })

    expect(wrapper.html()).to.contain('<a href="#/my/documents" title="Hello world documents"')
  })
})
