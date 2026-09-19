import { beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

import { NEW_DATA_EVENTS } from '@/constants'
import { useMemberNewData } from '@/features/order/use-member-new-data'

const mock = vi.hoisted(() => ({ events: [], gate: null }))

vi.mock('@/services/websocket/MemberNewDataSocket', () => ({
  default: class {
    async init(type) {
      mock.events.push(['init', type])
      if (mock.gate) await mock.gate
    }
    setOnmessageHandler(fn) { mock.events.push(['handler', fn]) }
    removeOnmessageHandler() { mock.events.push('removeHandler') }
    getSocket() { mock.events.push('getSocket') }
    removeSocket() { mock.events.push('removeSocket') }
  },
}))

const Harness = defineComponent({
  setup() {
    useMemberNewData(NEW_DATA_EVENTS.UNACCEPTED_ORDER, () => {})
    return () => h('div')
  },
})

function deferred() {
  let resolve
  const promise = new Promise((r) => { resolve = r })
  return { promise, resolve }
}

async function flush() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

function names() {
  return mock.events.map((event) => (Array.isArray(event) ? event[0] : event))
}

beforeEach(() => {
  mock.events = []
  mock.gate = null
})

describe('useMemberNewData', () => {
  test('registers the handler and connects once the room resolves', async () => {
    const gate = deferred()
    mock.gate = gate.promise
    mount(Harness)
    await flush()
    expect(names()).toEqual(['init'])

    gate.resolve()
    await flush()
    expect(names()).toEqual(['init', 'handler', 'getSocket'])
  })

  test('unmounting before the room resolves neither registers nor connects', async () => {
    const gate = deferred()
    mock.gate = gate.promise
    const wrapper = mount(Harness)
    await flush()

    wrapper.unmount()
    await flush()
    gate.resolve()
    await flush()

    expect(names()).toContain('removeHandler')
    expect(names()).toContain('removeSocket')
    expect(names()).not.toContain('handler')
    expect(names()).not.toContain('getSocket')
  })

  test('asks for the room once, not again on unmount', async () => {
    const wrapper = mount(Harness)
    await flush()

    wrapper.unmount()
    await flush()

    expect(names().filter((name) => name === 'init')).toHaveLength(1)
  })
})
