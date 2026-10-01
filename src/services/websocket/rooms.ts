import client from '@/services/api'

/**
 * The rooms asked for this session, by endpoint.
 *
 * A room is the secret a channel is addressed by, and the user room belongs to
 * one user, so the cache lives in memory and is dropped on logout
 * (`forgetSocketRooms`). It used to live in localStorage under a key naming only
 * the endpoint, which handed the next user on the browser the previous one's
 * room.
 */
const rooms = new Map<string, string>()

interface RoomPayload {
  room?: string
}

/** The room `url` hands out, asked of the backend once per session. */
export async function getRoom(url: string): Promise<string | undefined> {
  const cached = rooms.get(url)
  if (cached !== undefined) {
    return cached
  }

  const { data } = await client.get<RoomPayload>(url)
  if (data.room) {
    rooms.set(url, data.room)
  }
  return data.room
}

export function forgetSocketRooms() {
  rooms.clear()
}
