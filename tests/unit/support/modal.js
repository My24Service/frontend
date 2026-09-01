import { afterEach } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

/**
 * Driving a `b-modal` from a spec, through its DOM.
 *
 * The list screens do their search and their delete confirmation in modals, so
 * a spec that cannot open one has to reach past the DOM instead — emitting
 * `do-search` on the child component, or calling `doDelete()`. Both assert an
 * internal call rather than what a user can do, which #319 and #320 rule out.
 *
 * A modal is **teleported to `document.body`**, so it is not in the mounted
 * wrapper's tree and `wrapper.find` cannot see it. That is the only reason
 * this helper exists: everything below is ordinary DOM, driven with the events
 * a browser would send.
 *
 * `enableAutoUnmount` matters more here than usual. A teleported modal stays in
 * `document.body` after its test ends, so without it the next test's
 * `#search-modal` may be the previous test's — a spec that then "opens" a modal
 * and types into it is typing into a corpse, and its assertion about the
 * request that followed passes or fails for reasons unrelated to the screen.
 */
enableAutoUnmount(afterEach)

/** A handle on the teleported modal with this id. */
export function modal(id) {
  const root = () => {
    const element = document.getElementById(id)
    if (!element) throw new Error(`no modal '${id}' in the document — was it opened?`)
    return element
  }

  return {
    /** Whether the modal is on screen. bootstrap-vue-next toggles `display`. */
    isOpen: () => document.getElementById(id)?.style.display === 'block',

    /** Type `value` into the modal's only text input, as a user would. */
    type(value) {
      const input = root().querySelector('input[type="text"]')
      if (!input) throw new Error(`modal '${id}' has no text input`)
      input.value = value
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },

    /** Click the footer's primary button — the one labelled OK. */
    ok() {
      root().querySelector('.modal-footer .btn-primary').click()
    },

    /** Click the footer's secondary button — the one labelled Cancel. */
    cancel() {
      root().querySelector('.modal-footer .btn-secondary').click()
    },
  }
}
