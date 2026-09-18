import { onBeforeUnmount, onMounted } from 'vue'
import MemberNewDataSocket from '@/services/websocket/MemberNewDataSocket'
import type { NEW_DATA_EVENTS } from '@/constants'

export interface MemberNewDataMessage {
  type: string
  data_type: string
  [key: string]: unknown
}

type NewDataEvent = (typeof NEW_DATA_EVENTS)[keyof typeof NEW_DATA_EVENTS]

/**
 * Listen on the member's new-data websocket for one event type while the
 * component is mounted. The socket asks the backend for its room on `init`
 * and connects on `getSocket`; unmounting drops the handler and closes it,
 * which is what the legacy screens did in their `mounted`/`beforeUnmount`.
 */
export function useMemberNewData(event: NewDataEvent, onMessage: (message: MemberNewDataMessage) => void) {
  const socket = new MemberNewDataSocket()
  // `init` is async, so the mount can be torn down before it resolves. Without
  // this guard that late resolution registers a handler and opens a socket on
  // an unmounted component, and nothing is left to close it.
  let active = true

  onMounted(async () => {
    await socket.init(event)
    if (!active) return
    socket.setOnmessageHandler(onMessage)
    socket.getSocket()
  })

  onBeforeUnmount(() => {
    active = false
    socket.removeOnmessageHandler()
    socket.removeSocket()
  })
}
