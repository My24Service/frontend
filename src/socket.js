import Vue from "vue"

class Socket {
  reconnectTimeout = 5000
  socketsUser = {}
  onmessageHandlersUser = {}

  socketsMember = {}
  onmessageHandlersMember = {}

  setOnmessageHandlerUser(userPk, func) {
    this.onmessageHandlersUser[userPk] = func
  }

  removeOnmessageHandlerUser(userPk) {
    delete this.onmessageHandlersUser[userPk]
  }

  getSocketUser(userPk) {
    if (userPk in this.socketsUser) {
      return this.socketsUser[userPk]
    }

    const socket = this._connectUser(userPk)

    this.socketsUser[userPk] = socket

    return socket
  }

  removeSocketUser(userPk) {
    delete this.socketsUser[userPk]
  }

  setOnmessageHandlerMember(memberPk, func) {
    this.onmessageHandlersMember[memberPk] = func
  }

  removeOnmessageHandlerMember(memberPk) {
    delete this.onmessageHandlersMember[memberPk]
  }

  getSocketMember(memberPk) {
    if (memberPk in this.socketsMember) {
      return this.socketsMember[memberPk]
    }

    const socket = this._connectMember(memberPk)

    this.socketsMember[memberPk] = socket

    return socket
  }

  removeSocketMember(memberPk) {
    delete this.socketsMember[memberPk]
  }

  _connectUser(userPk) {
    const socket = new WebSocket(`ws://${window.location.host}/ws/notifications-user/${userPk}/`)
    socket.onmessage = (e) => {
      if (userPk in this.onmessageHandlersUser) {
        const data = JSON.parse(e.data)
        const handler = this.onmessageHandlersUser[userPk]
        handler(data.message)
      }
    }

    socket.onclose = (e) => {
      console.log('User socket is closed. Reconnect will be attempted in 1 second.')
      setTimeout(() => {
        this._connectUser(userPk)
      }, this.reconnectTimeout)
    }

    socket.onopen = (e) => {
      console.log('User socket is connected.')
    }

    return socket
  }

  _connectMember(memberPk) {
    const socket = new WebSocket(`ws://${window.location.host}/ws/notifications-member/`)
    socket.onmessage = (e) => {
      if (memberPk in this.onmessageHandlersMember) {
        const data = JSON.parse(e.data)
        const handler = this.onmessageHandlersMember[memberPk]
        handler(data.message)
      }
    }

    socket.onclose = (e) => {
      console.log('Member socket is closed. Reconnect will be attempted in 1 second.')
      setTimeout(() => {
        this._connectMember(memberPk)
      }, this.reconnectTimeout)
    }

    socket.onopen = (e) => {
      console.log('Member socket is connected.')
    }

    return socket
  }

}

export default new Socket()
