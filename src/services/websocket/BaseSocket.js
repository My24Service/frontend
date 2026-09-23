import axios from '@/services/api'

let BASE_URL = document.location.host

if (document.location.port !== '') {
  BASE_URL = BASE_URL.replace('3000', '8000')
}

/**
 * The rooms asked for this session, by endpoint.
 *
 * A room is the secret a channel is addressed by, and the user room belongs to
 * one user, so the cache lives in memory and is dropped on logout
 * (`forgetSocketRooms`). It used to live in localStorage under a key naming only
 * the endpoint, which handed the next user on the browser the previous one's
 * room.
 */
const rooms = new Map()

export function forgetSocketRooms() {
  rooms.clear()
}

class BaseSocket {
  protocol = document.location.protocol.indexOf('https') !== -1 ? 'wss' : 'ws'
  host = BASE_URL
  reconnectTimeout = 5000
  reconnectTimer = null
  debug = false

  setOnmessageHandler(func) {
    this.onmessageHandler = func
  }

  removeOnmessageHandler() {
    this.onmessageHandler = null
  }

  getSocket() {
    if (this.socket) {
      return this.socket
    }

    if (import.meta.env.VITE_TURN_OFF_WEBSOCKET) return

    const socket = this._connect()
    this.socket = socket

    return socket
  }

  removeSocket() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.onclose = null
      this.socket.close()
    }

    this.socket = null
  }

  async _getRoom(url) {
    if (rooms.has(url)) {
      return rooms.get(url)
    }

    const response = await axios.get(url)
    if (response) {
      const result = response.data
      if (this.debug) {
        console.log(`${this.name}: got room from backend: ${result.room}`)
      }
      if (result.room) {
        rooms.set(url, result.room)
      }

      return result.room
    } else {
      console.log(`no valid response for ${url}`)
    }
  }

  _getMemberRoom() {
    return axios.post('/get-member-room/', {}).then((response) => response.data)
  }

  _getMemberNewDataRoom() {
    return axios.post('/get-member-new-data-room/', {}).then((response) => response.data)
  }

  _onMessageMethod(e) {
    const data = JSON.parse(e.data)
    this.root.onmessageHandler(data.message)
  }

  _onCloseMethod(e) {
    const root = this.root

    if (!root.socket) {
      if (root.debug) {
        console.log(`${root.name}: socket is closed, not reconnecting.`)
      }
      return
    }

    root.socket = null

    if (root.debug) {
      console.log(`${root.name}: socket is closed. Reconnect will be attempted in ${root.reconnectTimeout}ms.`)
    }

    root.reconnectTimer = setTimeout(() => {
      root.reconnectTimer = null
      root.getSocket()
    }, root.reconnectTimeout)
  }

  _onOpenMethod(e) {
    if (this.debug) {
      console.log(`${this.root.name}: socket is connected.`)
    }
  }

  _connect() {
    if (process.env.NODE_ENV === 'test') {
      return
    }
    const url = this._getWsUrl()
    if (this.debug) {
      console.debug(`${this.name}: connecting to: ${url}`)
    }
    const socket = new WebSocket(url)
    socket.root = this

    socket.onmessage = this._onMessageMethod
    socket.onclose = this._onCloseMethod
    socket.onopen = this._onOpenMethod

    return socket
  }
}

export default BaseSocket
