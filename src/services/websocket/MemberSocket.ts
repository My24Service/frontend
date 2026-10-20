import { RoomSocket, anyMessage } from '@/services/websocket/RoomSocket'

// notifications all users of a member
export default new RoomSocket({
  name: 'MemberSocket',
  roomUrl: '/get-member-room/',
  channel: 'notifications-member',
  readMessage: anyMessage,
})
