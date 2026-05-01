import db from './db'

export interface Room {
  id: string
  created_at: number
}

export interface Message {
  id: number
  room_id: string
  sender_id: string
  content: string
  created_at: number
}

const stmtInsertRoom = db.prepare<[string, number]>(
  'INSERT INTO rooms (id, created_at) VALUES (?, ?)'
)

const stmtGetRoom = db.prepare<[string], Room>(
  'SELECT id, created_at FROM rooms WHERE id = ?'
)

const stmtGetMessages = db.prepare<[string], Message>(
  'SELECT id, room_id, sender_id, content, created_at FROM messages WHERE room_id = ? ORDER BY created_at ASC'
)

export function createRoom(id: string): Room {
  const now = Date.now()
  stmtInsertRoom.run(id, now)
  return { id, created_at: now }
}

export function getRoom(id: string): Room | undefined {
  return stmtGetRoom.get(id)
}

export function getMessages(roomId: string): Message[] {
  return stmtGetMessages.all(roomId)
}
