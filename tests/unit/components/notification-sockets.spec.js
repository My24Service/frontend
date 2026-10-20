import { beforeEach, describe, expect, test } from 'vitest'
import { nextTick } from 'vue'

import NotificationListener from '@/components/NotificationListener.vue'
import MemberNewDataSocket from '@/services/websocket/MemberNewDataSocket'
import memberSocket from '@/services/websocket/MemberSocket'
import userSocket from '@/services/websocket/UserSocket'

import { mountForm } from '../support/form-harness.js'
import { stubSocket } from '../support/sockets.js'

/**
 * The three sockets the notification component owns.
 *
 * `onMounted` registers a handler on each one and connects it, but `onUnmounted`
 * used to tear down only the member-new-data socket it creates for itself - the
 * two module singletons (`userSocket`, `memberSocket`) kept the unmounted
 * component's handler, and with it its closures, alive. Each socket is closed
 * in the same breath, so it stops reconnecting for a listener that is gone -
 * which is what `TheNavLoggedIn.doLogout` already does.
 */

// One recorder per socket. The member-new-data socket is constructed by the
// component itself, so its class's prototype is what gets stubbed; the other
// two are module singletons and are stubbed as they are.
function recorder() {
  const record = { events: [] }
  record.methods = {
    async init(...args) { record.events.push(['init', ...args]) },
    setOnmessageHandler(fn) { record.events.push(['handler', fn]) },
    getSocket() { record.events.push('getSocket') },
    removeOnmessageHandler() { record.events.push('removeHandler') },
    removeSocket() { record.events.push('removeSocket') },
  }
  return record
}

const sockets = { user: recorder(), member: recorder(), newData: recorder() }

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
  stubSocket(userSocket, sockets.user.methods)
  stubSocket(memberSocket, sockets.member.methods)
  stubSocket(MemberNewDataSocket.prototype, sockets.newData.methods)
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
