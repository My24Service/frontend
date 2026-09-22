import BaseSocket from '@/services/websocket/BaseSocket.js'

/**
 * What the member new-data socket hands its handlers: the parsed `message`
 * of one event. The index signature is the point - each event carries its own
 * payload beside `type` - so handlers read `type` and narrow from there.
 */
export interface MemberNewDataMessage {
  type: string
  data_type: string
  [key: string]: unknown
}


// notifications all users of a member for new data
class MemberNewDataSocket extends BaseSocket {
  name = 'MemberNewDataSocket'
  type: string | null = null
  room: string | null = null
  socket: WebSocket | null = null
  onmessageHandlers: Record<string, (data: MemberNewDataMessage) => void> = {}

  async init(type: string) {
    this.type = type
    this.room = await this._getRoom('/get-member-new-data-room/')
    if (this.debug) {
      console.log(`${this.name}: received room: ${this.room}`)
    }
  }

  setOnmessageHandler(func: (data: MemberNewDataMessage) => void) {
    this.onmessageHandlers[this.type as string] = func
  }

  removeOnmessageHandler() {
    delete this.onmessageHandlers[this.type!]
  }

  _getWsUrl() {
    return `${this.protocol}://${this.host}/ws/new-data-member/${this.room}/`
  }

  _onMessageMethod(this: { root: MemberNewDataSocket }, e: MessageEvent) {
    const type = this.root.type
    if (type !== null && type in this.root.onmessageHandlers) {
      const data = JSON.parse(e.data)
      this.root.onmessageHandlers[type](data.message)
    } else {
      // `root`: `this` here is the WebSocket the handler is bound to, which
      // has no `debug` - the flag lives on the socket, as in BaseSocket.
      if (this.root.debug) {
        console.log(`${this.root.name}: ${this.root.type} not found in this.onmessageHandlers:`, this.root.onmessageHandlers)
      }
    }
  }
}

export default MemberNewDataSocket
