import { describe, expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { h } from 'vue'

import { hLink } from '@/components/render'

/**
 * `hLink` renders a BLink, which falls back to `href="#"`. With hash routing
 * following that href changes the route, so a link that only runs a handler has
 * to stop the browser from following it. A real href has to stay followable.
 *
 * happy-dom does not navigate, so these read `defaultPrevented`: that is the
 * whole difference between the page staying put and it jumping to `#/`.
 */

function mountLink(props) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })
  return mount({ render: () => hLink(props, () => 'link') }, {
    global: { plugins: [router] },
  })
}

function click(wrapper) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  wrapper.get('a').element.dispatchEvent(event)
  return event
}

describe('hLink', () => {
  test('an action link runs its handler and does not navigate', () => {
    const onClick = vi.fn()
    const event = click(mountLink({ title: 'Revert', onClick }))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledWith(event)
    expect(event.defaultPrevented).toBe(true)
  })

  test('an action link keeps its other attributes', () => {
    const wrapper = mountLink({ title: 'Revert', class: 'px-1', onClick: vi.fn() })

    expect(wrapper.get('a').attributes('title')).toBe('Revert')
    expect(wrapper.get('a').classes()).toContain('px-1')
  })

  test('a link with a real href is left to the browser', () => {
    const wrapper = mountLink({ href: 'mailto:jan@example.com' })
    const event = click(wrapper)

    expect(wrapper.get('a').attributes('href')).toBe('mailto:jan@example.com')
    expect(event.defaultPrevented).toBe(false)
  })

  test('a link with a real href and a handler runs the handler and still navigates', () => {
    const onClick = vi.fn()
    const event = click(mountLink({ href: 'mailto:jan@example.com', onClick }))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(false)
  })

  test('renders its slot', () => {
    const wrapper = mount({ render: () => hLink({ onClick: vi.fn() }, () => h('b', 'inner')) }, {
      global: { plugins: [createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] })] },
    })

    expect(wrapper.get('a b').text()).toBe('inner')
  })
})
