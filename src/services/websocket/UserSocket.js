import BaseSocket from '@/services/websocket/BaseSocket.js'


// notifications to user
class UserSocket extends BaseSocket {
  name = 'UserSocket'
  userPk = null
  room = null
  socket = null
  onmessageHandler = null

  async init(userPk) {
    this.userPk = userPk
    this.room = await this._getRoom('/get-user-room/', {user_pk: this.userPk})
    console.log(`${this.name}: received room: ${this.room}`)
  }

  _getWsUrl() {
    return `${this.protocol}://${this.host}/ws/notifications-user/${this.room}/`
  }

}

export default new UserSocket()
