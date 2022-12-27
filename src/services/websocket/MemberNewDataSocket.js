import BaseSocket from '@/services/websocket/BaseSocket.js'


// notifications all users of a member for new data
class MemberNewDataSocket extends BaseSocket {
  name = 'MemberNewDataSocket'
  type = null
  room = null
  socket = null
  onmessageHandlers = {}

  async init(type) {
    this.type = type
    this.room = await this._getRoom('/get-member-new-data-room/')
    if (this.debug) {
      console.log(`${this.name}: received room: ${this.room}`)
    }
  }

  setOnmessageHandler(func) {
    this.onmessageHandlers[this.type] = func
  }

  removeOnmessageHandler() {
    delete this.onmessageHandlers[this.type]
  }

  _getWsUrl() {
    return `${this.protocol}://${this.host}/ws/new-data-member/${this.room}/`
  }

  _onMessageMethod(e) {
    if (this.root.type in this.root.onmessageHandlers) {
      const data = JSON.parse(e.data)
      this.root.onmessageHandlers[this.root.type](data.message)
    } else {
      if (this.debug) {
        console.log(`${this.root.name}: ${this.root.type} not found in this.onmessageHandlers:`, this.root.onmessageHandlers)
      }
    }
  }
}

export default MemberNewDataSocket
