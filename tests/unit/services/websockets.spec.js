import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import api from '@/services/api'
import { forgetSocketRooms } from '@/services/websocket/BaseSocket.js'
import MemberNewDataSocket from '@/services/websocket/MemberNewDataSocket'
import memberSocket from '@/services/websocket/MemberSocket'
import userSocket from '@/services/websocket/UserSocket'

/**
 * The three notification sockets, driven only through what the app calls
 * (`init`, `setOnmessageHandler`, `getSocket`, `removeOnmessageHandler`,
 * `removeSocket`, `forgetSocketRooms`) and observed only at their two edges:
 * the room request on the legacy client, and the browser `WebSocket`, which is
 * replaced by the fake below.
 */

const RECONNECT_MS = 5000

class FakeWebSocket {
  static opened = []

  constructor(url) {
    this.url = url
    this.closed = false
    this.onmessage = null
    this.onclose = null
    this.onopen = null
    FakeWebSocket.opened.push(this)
  }

  close() {
    this.closed = true
    // As a browser does: the handler runs with the socket as `this`.
    if (typeof this.onclose === 'function') this.onclose({ type: 'close' })
  }

  // The server pushes one event.
  receive(payload) {
    this.onmessage({ data: typeof payload === 'string' ? payload : JSON.stringify(payload) })
  }

  // The connection drops without the app asking for it.
  drop() {
    this.closed = true
    this.onclose({ type: 'close' })
  }
}

// The dev server's port maps onto the backend's; no port means same host.
const backendHost = location.port ? location.host.replace('3000', '8000') : location.host

const message = { type: 'new_data', data_type: 'order', id: 7 }

const kinds = [
  {
    name: 'UserSocket',
    make: () => userSocket,
    init: (socket) => socket.init(),
    roomUrl: '/get-user-room/',
    channel: 'notifications-user',
  },
  {
    name: 'MemberSocket',
    make: () => memberSocket,
    init: (socket) => socket.init(),
    roomUrl: '/get-member-room/',
    channel: 'notifications-member',
  },
  {
    name: 'MemberNewDataSocket',
    make: () => new MemberNewDataSocket(),
    init: (socket) => socket.init('dispatch'),
    roomUrl: '/get-member-new-data-room/',
    channel: 'new-data-member',
  },
]

let roomGet
let made

function rooms(...names) {
  for (const room of names) roomGet.mockResolvedValueOnce({ data: { room } })
}

function opened() {
  return FakeWebSocket.opened
}

async function connected(kind, handler = () => {}) {
  const socket = kind.make()
  made.push(socket)
  await kind.init(socket)
  socket.setOnmessageHandler(handler)
  const ws = socket.getSocket()
  return { socket, ws }
}

beforeEach(() => {
  vi.useFakeTimers()
  // Sockets open nothing under NODE_ENV=test; these specs are the exception.
  vi.stubEnv('NODE_ENV', 'development')
  vi.stubEnv('MODE', 'development')
  vi.stubGlobal('WebSocket', FakeWebSocket)
  FakeWebSocket.opened = []
  forgetSocketRooms()
  roomGet = vi.spyOn(api, 'get')
  made = []
})

afterEach(() => {
  // userSocket and memberSocket are module singletons: leave them closed.
  for (const socket of made) {
    socket.removeOnmessageHandler()
    socket.removeSocket()
  }
  vi.useRealTimers()
})

describe.each(kinds)('$name', (kind) => {
  test('asks its room endpoint, then connects to its channel in that room', async () => {
    rooms('room-1')
    const { ws } = await connected(kind)

    expect(roomGet).toHaveBeenCalledTimes(1)
    expect(roomGet).toHaveBeenCalledWith(kind.roomUrl)
    expect(opened()).toHaveLength(1)
    expect(ws).toBe(opened()[0])
    expect(ws.url).toBe(`ws://${backendHost}/ws/${kind.channel}/room-1/`)
  })

  test('getSocket keeps returning the one live connection', async () => {
    rooms('room-1')
    const { socket, ws } = await connected(kind)

    expect(socket.getSocket()).toBe(ws)
    expect(socket.getSocket()).toBe(ws)
    expect(opened()).toHaveLength(1)
  })

  test("hands the handler each event's message", async () => {
    rooms('room-1')
    const handler = vi.fn()
    const { ws } = await connected(kind, handler)

    ws.receive({ message })
    ws.receive({ message: { ...message, id: 8 } })

    expect(handler.mock.calls).toEqual([[message], [{ ...message, id: 8 }]])
  })

  test('a handler set later replaces the earlier one', async () => {
    rooms('room-1')
    const first = vi.fn()
    const second = vi.fn()
    const { socket, ws } = await connected(kind, first)

    socket.setOnmessageHandler(second)
    ws.receive({ message })

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith(message)
  })

  test('reconnects to the same room after the delay when the connection drops', async () => {
    rooms('room-1')
    const handler = vi.fn()
    const { socket, ws } = await connected(kind, handler)

    ws.drop()
    vi.advanceTimersByTime(RECONNECT_MS - 1)
    expect(opened()).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(opened()).toHaveLength(2)

    const again = opened()[1]
    expect(again.url).toBe(ws.url)
    expect(socket.getSocket()).toBe(again)
    expect(roomGet).toHaveBeenCalledTimes(1)

    again.receive({ message })
    expect(handler).toHaveBeenCalledWith(message)
  })

  test('keeps reconnecting while the connection keeps dropping', async () => {
    rooms('room-1')
    const { ws } = await connected(kind)

    ws.drop()
    vi.advanceTimersByTime(RECONNECT_MS)
    opened()[1].drop()
    vi.advanceTimersByTime(RECONNECT_MS)

    expect(opened()).toHaveLength(3)
  })

  test('removeSocket closes the connection and does not reconnect', async () => {
    rooms('room-1')
    const { socket, ws } = await connected(kind)

    socket.removeSocket()
    vi.advanceTimersByTime(RECONNECT_MS * 3)

    expect(ws.closed).toBe(true)
    expect(opened()).toHaveLength(1)
  })

  test('removeSocket during the reconnect delay cancels the reconnect', async () => {
    rooms('room-1')
    const { socket, ws } = await connected(kind)

    ws.drop()
    socket.removeSocket()
    vi.advanceTimersByTime(RECONNECT_MS * 3)

    expect(opened()).toHaveLength(1)
  })

  test('getSocket after removeSocket opens a fresh connection', async () => {
    rooms('room-1')
    const { socket, ws } = await connected(kind)

    socket.removeSocket()
    const again = socket.getSocket()

    expect(opened()).toHaveLength(2)
    expect(again).toBe(opened()[1])
    expect(again).not.toBe(ws)
    expect(again.url).toBe(ws.url)
  })

  test('logs the reconnect delay when debugging', async () => {
    rooms('room-1')
    const { socket, ws } = await connected(kind)
    socket.debug = true
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    ws.drop()

    expect(log).toHaveBeenCalledWith(expect.stringContaining(`${RECONNECT_MS}ms`))
    socket.debug = false
  })

  test('opens nothing when websockets are turned off', async () => {
    vi.stubEnv('VITE_TURN_OFF_WEBSOCKET', 'true')
    rooms('room-1')
    const { ws } = await connected(kind)

    expect(ws).toBeUndefined()
    expect(opened()).toHaveLength(0)
  })

  test('opens nothing under the test environment', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('MODE', 'test')
    rooms('room-1')
    const { ws } = await connected(kind)

    expect(ws).toBeUndefined()
    expect(opened()).toHaveLength(0)
  })
})

describe('MemberNewDataSocket', () => {
  const kind = kinds[2]

  test('drops events that are not a message envelope', async () => {
    rooms('room-1')
    const handler = vi.fn()
    const { ws } = await connected(kind, handler)

    ws.receive({ nothing: 'here' })
    ws.receive({ message: 'not an object' })
    ws.receive({ message: null })
    ws.receive('null')
    ws.receive('42')

    expect(handler).not.toHaveBeenCalled()
  })

  test('ignores events once its handler is removed', async () => {
    rooms('room-1')
    const handler = vi.fn()
    const { socket, ws } = await connected(kind, handler)

    socket.removeOnmessageHandler()

    expect(() => ws.receive({ message })).not.toThrow()
    expect(handler).not.toHaveBeenCalled()
  })

  test('each instance delivers to its own handler', async () => {
    rooms('room-1')
    const dispatch = vi.fn()
    const contracts = vi.fn()
    const a = await connected(kind, dispatch)
    const b = kind.make()
    made.push(b)
    await b.init('contract')
    b.setOnmessageHandler(contracts)
    const wsB = b.getSocket()

    a.ws.receive({ message })
    wsB.receive({ message: { ...message, id: 9 } })

    expect(dispatch.mock.calls).toEqual([[message]])
    expect(contracts.mock.calls).toEqual([[{ ...message, id: 9 }]])
  })
})

// A room is the secret a channel is addressed by, and the user room belongs to
// one user. It used to be cached in localStorage under a key naming only the
// endpoint, so it survived a logout: the next user to sign in on the same
// browser was put in the previous user's room.
describe('room cache', () => {
  test('asks the backend for a room once per endpoint', async () => {
    rooms('room-1')
    const kind = kinds[2]
    const a = await connected(kind)
    const b = await connected(kind)

    expect(roomGet).toHaveBeenCalledTimes(1)
    expect(b.ws.url).toBe(a.ws.url)
  })

  test('keeps rooms apart per endpoint', async () => {
    rooms('room-user', 'room-member')
    const user = await connected(kinds[0])
    const member = await connected(kinds[1])

    expect(roomGet).toHaveBeenCalledTimes(2)
    expect(user.ws.url).toContain('/room-user/')
    expect(member.ws.url).toContain('/room-member/')
  })

  test('forgets the rooms when told, so the next user gets their own', async () => {
    rooms('room-jan', 'room-piet')
    const jan = await connected(kinds[0])
    jan.socket.removeSocket()

    forgetSocketRooms()
    const piet = await connected(kinds[0])

    expect(roomGet).toHaveBeenCalledTimes(2)
    expect(piet.ws.url).toBe(`ws://${backendHost}/ws/notifications-user/room-piet/`)
  })

  test('keeps no room in localStorage, and ignores one left there', async () => {
    localStorage.setItem('get-user-room', JSON.stringify('room-of-someone-else'))
    rooms('room-jan')
    const { ws } = await connected(kinds[0])

    expect(ws.url).toContain('/room-jan/')
    expect(Object.keys(localStorage).filter((key) => key !== 'get-user-room')).toEqual([])
  })
})
