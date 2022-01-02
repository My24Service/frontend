import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import localVue from '../index'
import OrderStatusColorSpan from '@/components/OrderStatusColorSpan.vue'

describe('OrderStatusColorSpan.vue', () => {
  it('exists', () => {
    const wrapper = shallowMount(OrderStatusColorSpan, {
      localVue,
    })

    const navbrand = wrapper.findComponent(OrderStatusColorSpan)
    expect(navbrand.exists()).to.be.true
  })

  it('has color', async () => {
    const wrapper = await render(OrderStatusColorSpan, {
      localVue,
      propsData: {
        data: [
          {order_id: 1, color: '#fff'}
        ]
      }
    })

    const html = wrapper.html()
    expect(html).to.contain('style="background-color:#fff;">')
  })
})
