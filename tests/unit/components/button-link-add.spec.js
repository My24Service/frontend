import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ButtonLinkAdd from '@/components/ButtonLinkAdd'

const routes = [{
  path: '/hello/world',
  name: 'hello-world'
}]

const router = new VueRouter({routes})

describe('ButtonLinkAdd.vue', () => {
  test('exists',() => {
    const wrapper = shallowMount(ButtonLinkAdd,{
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
