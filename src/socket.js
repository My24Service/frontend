import Vue from "vue"

let BASE_URL = document.location.host

if (document.location.port !== '') {
  BASE_URL = BASE_URL.replace('3000', '8000')
}

class Socket {
  protocol = document.location.protocol.indexOf('https') !== -1 ? 'wss' : 'ws'
  host = BASE_URL
  reconnectTimeout = 5000


  socketsMember = {}
  onmessageHandlersMember = {}

  socketsMemberNewData = {}
  onmessageHandlersMemberNewData = {}

  userKeys = {}


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
  setOnmessageHandlerMemberNewData(memberPk, type, func) {
    if (!(memberPk in this.onmessageHandlersMemberNewData)) {
      this.onmessageHandlersMemberNewData[memberPk] = {}
    }
    this.onmessageHandlersMemberNewData[memberPk][type] = func
  }

  removeOnmessageHandlerMemberNewData(memberPk, type) {
    delete this.onmessageHandlersMemberNewData[memberPk][type]
  }

  getSocketMemberNewData(memberPk, type) {
    if (memberPk in this.socketsMemberNewData && type in this.socketsMemberNewData[memberPk]) {
      return this.socketsMemberNewData[memberPk][type]
    }

    if (!(memberPk in this.socketsMemberNewData)) {
      this.socketsMemberNewData[memberPk] = {}
    }

    const socket = this._connectMemberNewData(memberPk, type)

    this.socketsMemberNewData[memberPk][type] = socket

    return socket
  }

  removeSocketMemberNewData(memberPk, type) {
    const socket = this.socketsMemberNewData[memberPk][type]
    delete this.socketsMemberNewData[memberPk][type]
    socket.close()
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

  _connectMemberNewData(memberPk, type) {
    const socket = new WebSocket(`${this.protocol}://${this.host}/ws/new-data-member/${memberPk}/`)
    socket.onmessage = (e) => {
      if (memberPk in this.onmessageHandlersMemberNewData && type in this.onmessageHandlersMemberNewData[memberPk]) {
        const handler = this.onmessageHandlersMemberNewData[memberPk][type]
        const data = JSON.parse(e.data)
        handler(data.message)
      } else {
        console.log(`member ${memberPk} and type ${type} not in this.onmessageHandlersMemberNewData`)
      }
    }

    socket.onclose = (e) => {
      if (memberPk in this.socketsMemberNewData && type in this.onmessageHandlersMemberNewData[memberPk]) {
        setTimeout(() => {
          this._connectMember(memberPk, type)
        }, this.reconnectTimeout)
      } else {
        console.log(`Member socket for new data is closed, not reconnecting (member ${memberPk} and type ${type}) not found`)
      }
    }

    socket.onopen = (e) => {
      console.log(`Member socket for new data is connected (member ${memberPk} and type ${type}).`)
    }

    return socket
  }

}

export default new Socket()
