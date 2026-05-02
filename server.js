const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const https = require('https')

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

  CREATE TABLE IF NOT EXISTS participant_emails (
    room_id   TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    email     TEXT NOT NULL,
    PRIMARY KEY (room_id, sender_id)
  );
`)

const getRoom = db.prepare('SELECT id FROM rooms WHERE id = ?')
const insertMessage = db.prepare(
  'INSERT INTO messages (room_id, sender_id, content, created_at) VALUES (?, ?, ?, ?)'
)
const getRoomEmails = db.prepare(
  'SELECT sender_id, email FROM participant_emails WHERE room_id = ?'
)

// オンライン追跡: roomId -> Set<senderId>
const onlineSenders = new Map()
// メール通知のクールダウン: `${roomId}:${email}` -> lastSentAt
const emailCooldown = new Map()
const EMAIL_COOLDOWN_MS = 10 * 60 * 1000 // 10分

function messagePreview(content) {
  if (content.startsWith('__img__:')) return '📷 画像が届いています'
  if (content.startsWith('__location__:')) return '📍 現在地が届いています'
  return content.length > 80 ? content.slice(0, 80) + '…' : content
}

function sendEmailNotification(to, roomUrl, preview) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.NOTIFY_FROM || 'onboarding@resend.dev'
  if (!apiKey) return

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#4f46e5;margin-bottom:8px">新しいメッセージが届きました</h2>
      <p style="color:#374151;background:#f3f4f6;border-radius:8px;padding:12px 16px;margin:16px 0">
        ${preview.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </p>
      <a href="${roomUrl}"
         style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none">
        チャットを開く
      </a>
      <p style="color:#9ca3af;font-size:12px;margin-top:24px">
        メール通知を停止するにはチャット画面の🔔をオフにしてください。
      </p>
    </div>
  `

  const body = JSON.stringify({ from, to, subject: '新しいメッセージが届いています', html })
  const options = {
    hostname: 'api.resend.com',
    path: '/emails',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }
  const req = https.request(options, (res) => {
    res.resume()
    if (res.statusCode !== 200) {
      console.error(`Email send failed: ${res.statusCode}`)
    }
  })
  req.on('error', (e) => console.error('Email error:', e.message))
  req.write(body)
  req.end()
}

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

      const roomSockets = io.sockets.adapter.rooms.get(roomId)
      const currentCount = roomSockets ? roomSockets.size : 0

      if (currentCount >= 2) {
        socket.emit('error', { message: 'このルームはすでに2人が参加しています。' })
        return
      }

      currentRoom = roomId
      currentSenderId = senderId
      socket.join(roomId)

      if (!onlineSenders.has(roomId)) onlineSenders.set(roomId, new Set())
      onlineSenders.get(roomId).add(senderId)

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

      // オフラインの相手にメール通知
      const online = onlineSenders.get(roomId) || new Set()
      const emails = getRoomEmails.all(roomId)
      const siteUrl = process.env.SITE_URL || `http://localhost:${port}`
      const roomUrl = `${siteUrl}/room/${roomId}`
      const preview = messagePreview(content.trim())

      for (const { sender_id, email } of emails) {
        if (sender_id === senderId) continue // 送信者自身には送らない
        if (online.has(sender_id)) continue  // オンラインなら不要

        const cooldownKey = `${roomId}:${email}`
        const lastSent = emailCooldown.get(cooldownKey) || 0
        if (now - lastSent < EMAIL_COOLDOWN_MS) continue // クールダウン中

        emailCooldown.set(cooldownKey, now)
        sendEmailNotification(email, roomUrl, preview)
      }
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

      if (onlineSenders.has(currentRoom)) {
        onlineSenders.get(currentRoom).delete(currentSenderId)
        if (onlineSenders.get(currentRoom).size === 0) {
          onlineSenders.delete(currentRoom)
        }
      }
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
