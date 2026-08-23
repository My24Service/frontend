import BaseSocket from '@/services/websocket/BaseSocket.js'


// notifications to user
class UserSocket extends BaseSocket {
  name = 'UserSocket'
  room: string | null = null
  socket: WebSocket | null = null
  onmessageHandler: ((data: any) => void) | null = null

  async init() {
    this.room = await this._getRoom('/get-user-room/')
    if (this.debug) {
      console.log(`${this.name}: received room: ${this.room}`)
    }
  }

  _getWsUrl() {
    return `${this.protocol}://${this.host}/ws/notifications-user/${this.room}/`
  }

}

export default new UserSocket()
