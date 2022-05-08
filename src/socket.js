import Vue from "vue"

let BASE_URL = document.location.host

if (document.location.port !== '') {
  BASE_URL = BASE_URL.replace('3000', '8000')
}

class Socket {
  protocol = document.location.protocol.indexOf('https') !== -1 ? 'wss' : 'ws'
  host = BASE_URL
  reconnectTimeout = 5000

  socketsUser = {}
  onmessageHandlersUser = {}

  socketsMember = {}
  onmessageHandlersMember = {}

  socketsMemberNewData = {}
  onmessageHandlersMemberNewData = {}

  userKeys = {}

  createUserKey(memberPk, userPk) {
    const key = `${memberPk}/${userPk}`
    this.userKeys[userPk] = key

    return key
  }

  getUserKey(userPk) {
    if (userPk in this.userKeys) {
      return this.userKeys[userPk]
    }

    return undefined
  }

  // notifications to user
  setOnmessageHandlerUser(memberPk, userPk, func) {
    const key = this.createUserKey(memberPk, userPk)
    this.onmessageHandlersUser[key] = func
  }

  removeOnmessageHandlerUser(userPk) {
    const key = this.getUserKey(userPk)

    delete this.onmessageHandlersUser[key]
  }

  getSocketUser(memberPk, userPk) {
    const key = this.createUserKey(memberPk, userPk)

    if (key in this.socketsUser) {
      return this.socketsUser[key]
    }

    const socket = this._connectUser(memberPk, userPk)

    this.socketsUser[key] = socket

    return socket
  }

  removeSocketUser(userPk) {
    const key = this.getUserKey(userPk)

    const socket = this.socketsUser[key]
    delete this.socketsUser[userPk]
    if (socket) {
      socket.close()
    }
  }

  // notifications to member
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
    const socket = this.socketsMember[memberPk]
    delete this.socketsMember[memberPk]
    if (socket) {
      socket.close()
    }
  }

  // new data messages to member
  setOnmessageHandlerMemberNewData(memberPk, func) {
    this.onmessageHandlersMemberNewData[memberPk] = func
  }

  removeOnmessageHandlerMemberNewData(memberPk) {
    delete this.onmessageHandlersMemberNewData[memberPk]
  }

  getSocketMemberNewData(memberPk) {
    if (memberPk in this.socketsMemberNewData) {
      return this.socketsMemberNewData[memberPk]
    }

    const socket = this._connectMemberNewData(memberPk)

    this.socketsMemberNewData[memberPk] = socket

    return socket
  }

  removeSocketMemberNewData(memberPk) {
    const socket = this.socketsMemberNewData[memberPk]
    delete this.socketsMemberNewData[memberPk]
    socket.close()
  }

  // internal methods
  _connectUser(memberPk, userPk) {
    const key = this.createUserKey(memberPk, userPk)

    const socket = new WebSocket(`${this.protocol}://${this.host}/ws/notifications-user/${key}/`)
    socket.onmessage = (e) => {
      if (key in this.onmessageHandlersUser) {
        const data = JSON.parse(e.data)
        const handler = this.onmessageHandlersUser[key]
        handler(data.message)
      }
    }

    socket.onclose = (e) => {
      if (key in this.socketsUser) {
        console.log('User socket is closed. Reconnect will be attempted in 1 second.')
        setTimeout(() => {
          this._connectUser(memberPk, userPk)
        }, this.reconnectTimeout)
      } else {
        console.log('User socket is closed, not reconnecting')
      }
    }

    socket.onopen = (e) => {
      console.log('User socket is connected.')
    }

    return socket
  }

  _connectMember(memberPk) {
    const socket = new WebSocket(`${this.protocol}://${this.host}/ws/notifications-member/${memberPk}/`)
    socket.onmessage = (e) => {
      if (memberPk in this.onmessageHandlersMember) {
        const data = JSON.parse(e.data)
        const handler = this.onmessageHandlersMember[memberPk]
        handler(data.message)
      }
    }

    socket.onclose = (e) => {
      if (memberPk in this.socketsMember) {
        console.log('Member socket is closed. Reconnect will be attempted in 1 second.')
        setTimeout(() => {
          this._connectMember(memberPk)
        }, this.reconnectTimeout)
      } else {
        console.log('Member socket is closed, not reconnecting')
      }
    }

    socket.onopen = (e) => {
      console.log('Member socket is connected.')
    }

    return socket
  }

  _connectMemberNewData(memberPk) {
    const socket = new WebSocket(`${this.protocol}://${this.host}/ws/new-data-member/${memberPk}/`)
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data)
      console.log(`_connectMemberNewData: new data: ${data.message}`)
      if (memberPk in this.onmessageHandlersMemberNewData) {
        const handler = this.onmessageHandlersMemberNewData[memberPk]
        handler(data.message)
      } else {
        console.log(`member ${memberPk} not in this.onmessageHandlersMemberNewData`)
      }
    }

    socket.onclose = (e) => {
      if (memberPk in this.socketsMemberNewData) {
        console.log('Member socket for new data is closed. Reconnect will be attempted in 1 second.')
        setTimeout(() => {
          this._connectMember(memberPk)
        }, this.reconnectTimeout)
      } else {
        console.log('Member socket for new data is closed, not reconnecting')
      }
    }

    socket.onopen = (e) => {
      console.log('Member socket for new data is connected.')
    }

    return socket
  }

}

export default new Socket()
