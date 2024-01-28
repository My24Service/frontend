import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import OrderStatusColorSpan from '@/components/OrderStatusColorSpan.vue'

describe('OrderStatusColorSpan.vue', () => {
  test('exists', () => {
    const wrapper = shallowMount(OrderStatusColorSpan, {
    })

    const navbrand = wrapper.findComponent(OrderStatusColorSpan)
    expect(navbrand.exists()).to.be.true
  })

  test('has color', async () => {
    const wrapper = await render(OrderStatusColorSpan, {
      propsData: {
        data: [
          {order_id: 1, color: '#fff'}
        ]
      }
    })

    const html = wrapper.html()
    // console.log()
    expect(html).to.contain('style="background-color:#fff;"')
  })
})
