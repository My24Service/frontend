import { beforeEach, describe, expect, test, vi } from 'vitest'
import { nextTick } from 'vue'

import NotificationListener from '@/components/NotificationListener.vue'

import { mountForm } from '../support/form-harness.js'

// The component toasts through useToast(); the harness supplies the spy the
// rest of the suite asserts on, which needs no BApp around the mount.
vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The three sockets the notification component owns.
 *
 * `onMounted` registers a handler on each one and connects it, but `onUnmounted`
 * used to tear down only the member-new-data socket it creates for itself - the
 * two module singletons (`userSocket`, `memberSocket`) kept the unmounted
 * component's handler, and with it its closures, alive. Removing the handler
 * alone is not enough either: `BaseSocket._onMessageMethod` calls
 * `onmessageHandler` without checking it, so the socket has to be closed in the
 * same breath, which is what `TheNavLoggedIn.doLogout` already does.
 */

const sockets = vi.hoisted(() => {
  function fake() {
    return {
      events: [],
      async init(...args) { this.events.push(['init', ...args]) },
      setOnmessageHandler(fn) { this.events.push(['handler', fn]) },
      getSocket() { this.events.push('getSocket') },
      removeOnmessageHandler() { this.events.push('removeHandler') },
      removeSocket() { this.events.push('removeSocket') },
    }
  }

  return { user: fake(), member: fake(), newData: fake() }
})

vi.mock('@/services/websocket/UserSocket', () => ({ default: sockets.user }))
vi.mock('@/services/websocket/MemberSocket', () => ({ default: sockets.member }))
vi.mock('@/services/websocket/MemberNewDataSocket', () => ({
  // The component constructs its own instance; hand it the recorded fake.
  default: class {
    constructor() { return sockets.newData }
  },
}))

async function flush() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

function names(socket) {
  return socket.events.map((event) => (Array.isArray(event) ? event[0] : event))
}

const all = () => [sockets.user, sockets.member, sockets.newData]

beforeEach(() => {
  for (const socket of all()) socket.events = []
})

describe('NotificationListener', () => {
  test('registers and connects one handler per socket on mount', async () => {
    mountForm(NotificationListener)
    await flush()

    for (const socket of all()) {
      expect(names(socket)).toEqual(['init', 'handler', 'getSocket'])
    }
  })

  test('drops every handler, and closes every socket, on unmount', async () => {
    const wrapper = mountForm(NotificationListener)
    await flush()

    wrapper.unmount()
    await flush()

    for (const socket of all()) {
      expect(names(socket)).toContain('removeHandler')
      expect(names(socket)).toContain('removeSocket')
    }
  })
})
