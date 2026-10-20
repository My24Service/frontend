import { RoomSocket, anyMessage } from '@/services/websocket/RoomSocket'

// notifications to user
export default new RoomSocket({
  name: 'UserSocket',
  roomUrl: '/get-user-room/',
  channel: 'notifications-user',
  readMessage: anyMessage,
})
