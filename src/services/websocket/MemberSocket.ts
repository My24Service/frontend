import BaseSocket from '@/services/websocket/BaseSocket.js'


// notifications all users of a member
class MemberSocket extends BaseSocket {
  name = 'MemberSocket'
  room: string | null = null
  socket: WebSocket | null = null
  onmessageHandler: ((data: unknown) => void) | null = null

  async init() {
    const room: unknown = await this._getRoom('/get-member-room/')
    this.room = typeof room === 'string' ? room : null
    if (this.debug) {
      console.log(`${this.name}: received room: ${this.room}`)
    }
  }

  _getWsUrl() {
    return `${this.protocol}://${this.host}/ws/notifications-member/${this.room}/`
  }

}

export default new MemberSocket()
