import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import VueRouter from 'vue-router'
import IconLinkEdit from '@/components/IconLinkEdit'

const routes = [{
  path: '/edit/this/:pk',
  name: 'edit-this',
  props: route => ({...route.params}),
}]

const router = new VueRouter({routes})

describe('IconLinkEdit.vue', () => {
  test('exists',() => {
    const wrapper = shallowMount(IconLinkEdit,{
      router,
      propsData: {
        router_name: 'edit-this',
        router_params: {pk: '1'},
        title: 'Hello world edit'
      }
    })

    const el = wrapper.findComponent(IconLinkEdit)
    expect(el.exists()).to.be.true
  })

  test('renders', async () => {
    const wrapper = await render(IconLinkEdit,{
      router,
      propsData: {
        router_name: 'edit-this',
        router_params: {pk: '1'},
        title: 'Hello world edit'
      },
    })

    expect(wrapper.html()).to.contain('<a href="#/edit/this/1" title="Hello world edit"')
  })
})
