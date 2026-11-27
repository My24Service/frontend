import { describe, expect, test } from 'vitest'
import { defineComponent, h } from 'vue'

import { DetailLayoutCards, DetailLayoutSidebar } from '@/features/shared'
import { mountForm } from '../../support/form-harness.js'

/**
 * The two family frames of a detail page (src/features/shared/detail/). Each
 * renders a block only for a slot its view fills; these specs pin that for
 * the parts slot, which only the equipment detail fills.
 */

const props = {detailsTitle: 'Details', ordersTitle: 'Orders', fields: []}

/** The layout as a view uses it: filled through named slots. */
function mountLayout(layout, slots = {}) {
  const host = defineComponent({render: () => h(layout, props, slots)})
  return mountForm(host, {deep: true})
}

describe.each([
  ['DetailLayoutSidebar', DetailLayoutSidebar],
  ['DetailLayoutCards', DetailLayoutCards],
])('%s', (_name, layout) => {
  test('renders the parts slot under a Parts heading', () => {
    const wrapper = mountLayout(layout, {parts: () => h('div', {class: 'parts-content'}, 'Door')})

    expect(wrapper.text()).toContain('Parts')
    expect(wrapper.find('.parts-content').exists()).toBe(true)
  })

  test('renders no Parts block when the view fills no parts slot', () => {
    const wrapper = mountLayout(layout)

    expect(wrapper.text()).not.toContain('Parts')
  })
})
