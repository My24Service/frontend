import Vue from "vue"
import axios from '@/services/api'

let BASE_URL = document.location.host

if (document.location.port !== '') {
  BASE_URL = BASE_URL.replace('3000', '8000')
}

class BaseSocket {
  protocol = document.location.protocol.indexOf('https') !== -1 ? 'wss' : 'ws'
  host = BASE_URL
  reconnectTimeout = 5000

  userKeys = {}

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

    const socket = this._connect()
    this.socket = socket

    return socket
  }

  removeSocket() {
    if (this.socket) {
      this.socket.close()
    }

    this.socket = null
  }

  _getStorageKey(url) {
    return url.replaceAll('/', '')
  }

  _storeRoom(url, room) {
    const key = this._getStorageKey(url)
    localStorage.setItem(key, JSON.stringify(room))
  }

  _getRoomFromStorage(url, room) {
    const key = this._getStorageKey(url)
    return JSON.parse(localStorage.getItem(key))
  }

  async _getRoom(url) {
    const room = this._getRoomFromStorage(url)
    if (room) {
      console.log(`${this.name}: got room from storage: ${room}`)
      return room
    }

    const result = await axios.get(url).then((response) => response.data)
    console.log(`${this.name}: got room from backend: ${result.room}`)
    this._storeRoom(url, result.room)

    return result.room
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
    if (this.root.socket) {
      console.log(`${this.root.name}: socket is closed. Reconnect will be attempted in 1 second.`)
      setTimeout(() => {
        this.root._connect()
      }, this.reconnectTimeout)
    } else {
      console.log(`${this.root.name}: socket is closed, not reconnecting.`)
    }
  }

  _onOpenMethod(e) {
    console.log(`${this.root.name}: socket is connected.`)
  }

  _connect() {
    const url = this._getWsUrl()
    console.debug(`${this.name}: connecting to: ${url}`)
    const socket = new WebSocket(url)
    socket.root = this

    socket.onmessage = this._onMessageMethod
    socket.onclose = this._onCloseMethod
    socket.onopen = this._onOpenMethod

    return socket
  }
}

export default BaseSocket
