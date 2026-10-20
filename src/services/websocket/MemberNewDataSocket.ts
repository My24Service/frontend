import { RoomSocket } from '@/services/websocket/RoomSocket'

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

/**
 * The `data` envelope one socket event parses to: the handler's payload
 * rides `message`.
 */
interface MemberNewDataEnvelope {
  message: MemberNewDataMessage
}

function isNewDataEnvelope(data: unknown): data is MemberNewDataEnvelope {
  if (typeof data !== 'object' || data === null || !('message' in data)) {
    return false
  }
  const message: unknown = data.message
  return typeof message === 'object' && message !== null
}


// notifications all users of a member for new data
class MemberNewDataSocket extends RoomSocket<MemberNewDataMessage> {
  /**
   * The event this instance was set up for. Only the debug output reads it:
   * every new-data event in the room reaches every socket in it.
   */
  type: string | null = null

  constructor() {
    super({
      name: 'MemberNewDataSocket',
      roomUrl: '/get-member-new-data-room/',
      channel: 'new-data-member',
      readMessage: (data) => (isNewDataEnvelope(data) ? data : undefined),
    })
  }

  override async init(type?: string) {
    this.type = type ?? null
    await super.init()
  }
}

export default MemberNewDataSocket
