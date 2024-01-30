import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import VueRouter from 'vue-router'
import IconLinkPlus from '@/components/IconLinkPlus'

const routes = [{
  path: '/add/something',
  name: 'add-something'
}]

const router = new VueRouter({routes})

function myFunction() {}

describe('IconLinkPlus.vue', () => {
  test('exists',() => {
    const wrapper = shallowMount(IconLinkPlus,{
      router,
      propsData: {
        router_name: 'my-documents',
        router_params: {my: 'documents'},
        title: 'Hello world documents'
      }
    })

    const el = wrapper.findComponent(IconLinkPlus)
    expect(el.exists()).to.be.true
  })

  test('renders th method', async () => {
    const wrapper = await render(IconLinkPlus,{
      router,
      propsData: {
        type: 'th',
        method: myFunction,
        title: 'Hello world my th method'
      },
    })

    const html = wrapper.html()
    expect(html).to.contain('icon-th')
    expect(html).to.contain('href="#"')
    expect(html).not.to.contain('href="#/add/something')
    expect(html).not.to.contain('class="px-1"')
  })

  test('renders th route', async () => {
    const wrapper = await render(IconLinkPlus,{
      router,
      propsData: {
        type: 'th',
        router_name: 'add-something',
        title: 'Hello world my th router name'
      },
    })

    const html = wrapper.html()
    expect(html).to.contain('icon-th')
    expect(html).to.contain('href="#/add/something')
    expect(html).not.to.contain('href="#"')
    expect(html).not.to.contain('class="px-1"')
  })

  test('renders tr method', async () => {
    const wrapper = await render(IconLinkPlus,{
      router,
      propsData: {
        type: 'tr',
        method: myFunction,
        title: 'Hello world my tr method'
      },
    })

    const html = wrapper.html()
    expect(html).to.contain('class="px-1"')
    expect(html).to.contain('href="#"')
    expect(html).not.to.contain('icon-th')
    expect(html).not.to.contain('href="#/add/something')
  })

  test('renders tr route', async () => {
    const wrapper = await render(IconLinkPlus,{
      router,
      propsData: {
        type: 'tr',
        router_name: 'add-something',
        title: 'Hello world my th router name'
      },
    })

    const html = wrapper.html()
    expect(html).to.contain('class="px-1"')
    expect(html).to.contain('href="#/add/something"')
    expect(html).not.to.contain('icon-th')
    expect(html).not.to.contain('href="#"')
  })
})
