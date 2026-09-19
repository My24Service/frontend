import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import BaseSocket from '@/services/websocket/BaseSocket.js'

// The base socket's _connect is disabled under NODE_ENV=test and returns a real
// WebSocket otherwise. Overriding it lets the specs drive close events on a
// fake that mirrors the wiring _connect performs: an unbound onclose handler
// whose `this` is the socket and whose `root` is the BaseSocket instance.
class TestSocket extends BaseSocket {
  constructor() {
    super()
    this.sockets = []
  }

  _connect() {
    const socket = {
      root: this,
      onclose: null,
      onopen: null,
      onmessage: null,
      closed: false,
      close() {
        this.closed = true
        if (typeof this.onclose === 'function') this.onclose()
      },
    }

    socket.onclose = this._onCloseMethod
    this.sockets.push(socket)

    return socket
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('BaseSocket reconnect lifecycle', () => {
  test('tracks the reconnected socket after an unexpected close', () => {
    const socket = new TestSocket()
    const first = socket.getSocket()

    expect(socket.socket).toBe(first)

    first.onclose()

    expect(socket.socket).toBeNull()

    vi.advanceTimersByTime(1)
    expect(socket.sockets).toHaveLength(1)

    vi.advanceTimersByTime(socket.reconnectTimeout)

    expect(socket.sockets).toHaveLength(2)
    expect(socket.socket).toBe(socket.sockets[1])
    expect(socket.socket).not.toBe(first)
  })

  test('logs the configured reconnect delay off the instance', () => {
    const socket = new TestSocket()
    socket.debug = true
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const first = socket.getSocket()
    first.onclose()

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining(`${socket.reconnectTimeout}ms`),
    )
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining('1 second'))
  })

  test('teardown during the reconnect window cancels the pending reconnect', () => {
    const socket = new TestSocket()
    const first = socket.getSocket()
    first.onclose()

    expect(socket.socket).toBeNull()

    socket.removeSocket()
    vi.advanceTimersByTime(socket.reconnectTimeout * 2)

    expect(socket.sockets).toHaveLength(1)
    expect(socket.socket).toBeNull()
  })

  test('removeSocket closes the live socket and stops reconnection', () => {
    const socket = new TestSocket()
    const first = socket.getSocket()

    socket.removeSocket()

    expect(first.closed).toBe(true)
    expect(first.onclose).toBeNull()
    expect(socket.socket).toBeNull()

    vi.advanceTimersByTime(socket.reconnectTimeout * 2)

    expect(socket.sockets).toHaveLength(1)
    expect(socket.socket).toBeNull()
  })
})
