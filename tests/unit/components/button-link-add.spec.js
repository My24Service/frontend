import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import VueRouter from 'vue-router'
import localVue from '../index'
import ButtonLinkAdd from '@/components/ButtonLinkAdd'

const routes = [{
  path: '/hello/world',
  name: 'hello-world'
}]

const router = new VueRouter({routes})

describe('ButtonLinkAdd.vue', () => {
  it('exists',() => {
    const wrapper = shallowMount(ButtonLinkAdd,{
      localVue,
      router,
      propsData: {
        router_name: 'hello-world',
        router_params: {hello: 'world'},
        title: 'Hello world add'
      }
    })

    const el = wrapper.findComponent(ButtonLinkAdd)
    expect(el.exists()).to.be.true
  })

})
