import BaseSocket from '@/services/websocket/BaseSocket.js'


// notifications all users of a member
class MemberSocket extends BaseSocket {
  name = 'MemberSocket'
  room = null
  socket = null
  onmessageHandler = null

  async init() {
    this.room = await this._getRoom('/get-member-room/')
    if (this.debug) {
      console.log(`${this.name}: received room: ${this.room}`)
    }
  }

  _getWsUrl() {
    return `${this.protocol}://${this.host}/ws/notifications-member/${this.room}/`
  }

}

export default new MemberSocket()
