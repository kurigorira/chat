const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)

// Ensure data directory exists (DATABASE_DIR env var for Railway Volume)
const dataDir = process.env.DATABASE_DIR || path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(path.join(dataDir, 'chat.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id         TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id    TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id  TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
`)

const getRoom = db.prepare('SELECT id FROM rooms WHERE id = ?')
const insertMessage = db.prepare(
  'INSERT INTO messages (room_id, sender_id, content, created_at) VALUES (?, ?, ?, ?)'
)

const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: '*' },
  })

  // Track senders per room: roomId -> Set<senderId>
  const roomSenders = new Map()

  io.on('connection', (socket) => {
    let currentRoom = null
    let currentSenderId = null

    socket.on('join_room', ({ roomId, senderId }) => {
      if (!roomId || !senderId) return

      const room = getRoom.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'ルームが見つかりません。' })
        return
      }

      // Count current sockets in this room
      const roomSockets = io.sockets.adapter.rooms.get(roomId)
      const currentCount = roomSockets ? roomSockets.size : 0

      if (currentCount >= 2) {
        socket.emit('error', { message: 'このルームはすでに2人が参加しています。' })
        return
      }

      currentRoom = roomId
      currentSenderId = senderId
      socket.join(roomId)

      if (!roomSenders.has(roomId)) roomSenders.set(roomId, new Set())
      roomSenders.get(roomId).add(senderId)

      const newCount = (io.sockets.adapter.rooms.get(roomId) || { size: 1 }).size

      socket.emit('room_joined', { roomId, participantCount: newCount })

      if (newCount > 1) {
        socket.to(roomId).emit('user_joined', { participantCount: newCount })
      }
    })

    socket.on('send_message', ({ roomId, senderId, content }) => {
      if (!roomId || !senderId || !content) return
      if (typeof content !== 'string' || content.trim().length === 0) return
      if (content.length > 10000) return

      const room = getRoom.get(roomId)
      if (!room) {
        socket.emit('error', { message: 'ルームが見つかりません。' })
        return
      }

      const now = Date.now()
      const result = insertMessage.run(roomId, senderId, content.trim(), now)

      io.to(roomId).emit('new_message', {
        id: result.lastInsertRowid,
        roomId,
        senderId,
        content: content.trim(),
        createdAt: now,
      })
    })

    socket.on('mark_read', ({ roomId, readAt }) => {
      if (!roomId || typeof readAt !== 'number') return
      socket.to(roomId).emit('partner_read', { readAt })
    })

    socket.on('disconnect', () => {
      if (!currentRoom) return

      const roomSockets = io.sockets.adapter.rooms.get(currentRoom)
      const remainingCount = roomSockets ? roomSockets.size : 0

      socket.to(currentRoom).emit('user_left', { participantCount: remainingCount })

      if (remainingCount === 0 && roomSenders.has(currentRoom)) {
        roomSenders.delete(currentRoom)
      }
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
