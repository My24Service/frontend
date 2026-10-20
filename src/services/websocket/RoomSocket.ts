import { getRoom } from '@/services/websocket/rooms'

// The dev server runs on :3000 and the backend on :8000; deployed, they share
// a host.
const host = document.location.port !== ''
  ? document.location.host.replace('3000', '8000')
  : document.location.host

const protocol = document.location.protocol.includes('https') ? 'wss' : 'ws'

/** What one parsed event carries for the handler; `undefined` drops it. */
type ReadMessage<TMessage> = (data: unknown) => { message: TMessage } | undefined

export interface RoomSocketOptions<TMessage> {
  /** Labels the socket's debug output. */
  name: string
  /** The endpoint that hands out this socket's room. */
  roomUrl: string
  /** The channel's path under `/ws/`, ahead of the room. */
  channel: string
  readMessage: ReadMessage<TMessage>
}

/** Any event that parses to an object: its `message`, whatever that holds. */
export function anyMessage(data: unknown): { message: unknown } | undefined {
  if (typeof data !== 'object' || data === null) {
    return undefined
  }
  return { message: 'message' in data ? data.message : undefined }
}

/**
 * One websocket channel in a room the backend assigns. `init` asks for the
 * room, `getSocket` connects, every event's message goes to the handler, and a
 * dropped connection is reopened after `reconnectTimeout` until `removeSocket`
 * closes it for good.
 */
export class RoomSocket<TMessage = unknown> {
  readonly name: string
  debug = false
  reconnectTimeout = 5000

  private readonly options: RoomSocketOptions<TMessage>
  private room: string | null = null
  private socket: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private handler: ((message: TMessage) => void) | null = null

  constructor(options: RoomSocketOptions<TMessage>) {
    this.options = options
    this.name = options.name
  }

  async init(): Promise<void> {
    this.room = (await getRoom(this.options.roomUrl)) ?? null
    this.log(`received room: ${this.room}`)
  }

  setOnmessageHandler(handler: (message: TMessage) => void) {
    this.handler = handler
  }

  removeOnmessageHandler() {
    this.handler = null
  }

  getSocket(): WebSocket | undefined {
    if (this.socket) {
      return this.socket
    }

    if (import.meta.env.VITE_TURN_OFF_WEBSOCKET) return undefined

    this.socket = this.connect()
    return this.socket ?? undefined
  }

  removeSocket() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.onclose = null
      this.socket.close()
    }

    this.socket = null
  }

  private connect(): WebSocket | null {
    if (process.env.NODE_ENV === 'test') {
      return null
    }

    const url = `${protocol}://${host}/ws/${this.options.channel}/${this.room}/`
    this.log(`connecting to: ${url}`)
    const socket = new WebSocket(url)
    socket.onmessage = this.onMessage
    socket.onclose = this.onClose
    socket.onopen = this.onOpen

    return socket
  }

  // Arrow functions, because the browser calls these with the WebSocket as
  // `this`, not the RoomSocket.

  private onMessage = (event: MessageEvent) => {
    if (!this.handler) {
      this.log('no handler, event dropped.')
      return
    }

    const data: unknown = JSON.parse(String(event.data))
    const read = this.options.readMessage(data)
    if (read) {
      this.handler(read.message)
    }
  }

  private onClose = () => {
    if (!this.socket) {
      this.log('socket is closed, not reconnecting.')
      return
    }

    this.socket = null
    this.log(`socket is closed. Reconnect will be attempted in ${this.reconnectTimeout}ms.`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.getSocket()
    }, this.reconnectTimeout)
  }

  private onOpen = () => {
    this.log('socket is connected.')
  }

  private log(text: string) {
    if (this.debug) {
      console.log(`${this.name}: ${text}`)
    }
  }
}
