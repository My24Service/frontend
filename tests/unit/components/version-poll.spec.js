import { describe, expect, test, vi } from 'vitest'

import Version from '@/components/Version.vue'

import { mountForm } from '../support/form-harness.js'

/**
 * The version poll's lifecycle (src/components/Version.vue).
 *
 * The component arms a fifteen-minute interval to look for a new build, and
 * that interval has to die with the component. It did not: \`onUnmounted\` called
 * \`clearInterval(intervalId)\` with the ref and not with \`intervalId.value\`,
 * so the poll outlived every unmount and kept running for the life of the tab.
 *
 * The timer count is the whole observable behaviour. Under happy-dom the page
 * is served over http and \`checkVersion\` deliberately does nothing unless the
 * page is https, so there is no request to assert on; what is left is the
 * timer, and whether unmounting takes it with it.
 */
describe('Version', () => {
  test('disarms the version poll when the component is unmounted', () => {
    vi.useFakeTimers()
    try {
      const wrapper = mountForm(Version)
      const armed = vi.getTimerCount()

      wrapper.unmount()

      // The delta, not an absolute count: the modal the component renders
      // keeps a timer of its own that outlives the unmount. Only one timer
      // belongs to this component, and it must be the one that stops.
      expect(armed - vi.getTimerCount()).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })
})
