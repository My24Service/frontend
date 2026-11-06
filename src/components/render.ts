import type { VNodeChild } from 'vue'
import { BButton, BLink } from 'bootstrap-vue-next'

// BLink and BButton declare their own `to?: RouteLocationRaw` prop, and with
// the typed route table (~300 routes, ~600 location members) that is more than
// h()'s overload resolution will represent (TS2590), intermittently and
// depending on check order. Render functions go through these instead: the
// cast lives here once, and callers keep checked props for what they use.
// Pass a location through `to` in a template, where it is typed.

interface ClickProps {
  class?: string
  title?: string
  onClick?: (event: MouseEvent) => void
}

export interface LinkProps extends ClickProps {
  href?: string
}

export interface ButtonProps extends ClickProps {
  type?: 'button' | 'submit' | 'reset'
  size?: 'sm' | 'md' | 'lg'
  variant?: string
}

type Slot = () => VNodeChild

/**
 * A link without an href only runs its handler. BLink still renders it as
 * `href="#"`, which under hash routing changes the route, so the browser must
 * not follow it. A real href (`mailto:`) is left alone.
 */
export function hLink(props: LinkProps, slot: Slot) {
  const { href, onClick } = props
  if (href || !onClick) return h(BLink as Component, props, slot)

  const stayAndRun = (event: MouseEvent) => {
    event.preventDefault()
    onClick(event)
  }
  return h(BLink as Component, { ...props, onClick: stayAndRun }, slot)
}

export function hButton(props: ButtonProps, slot: Slot) {
  return h(BButton as Component, props, slot)
}
