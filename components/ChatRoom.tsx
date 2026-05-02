'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import NotificationToggle from './NotificationToggle'
import Link from 'next/link'

interface Message {
  id: number
  senderId: string
  content: string
  createdAt: number
}

interface Props {
  roomId: string
}

function messagePreview(content: string) {
  if (content.startsWith('__img__:')) return '📷 画像が届きました'
  if (content.startsWith('__location__:')) return '📍 現在地が届きました'
  return content.length > 50 ? content.slice(0, 50) + '…' : content
}

export default function ChatRoom({ roomId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [senderId, setSenderId] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [partnerReadAt, setPartnerReadAt] = useState<number | null>(null)
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const senderIdRef = useRef('')
  const notifEnabledRef = useRef(false)

  function handleNotifToggle(on: boolean) {
    setNotifEnabled(on)
    notifEnabledRef.current = on
    localStorage.setItem(`notif:${roomId}`, on ? '1' : '0')
  }

  function emitMarkRead() {
    if (socketRef.current && roomId) {
      socketRef.current.emit('mark_read', { roomId, readAt: Date.now() })
    }
  }

  useEffect(() => {
    let sid = sessionStorage.getItem(`senderId:${roomId}`)
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem(`senderId:${roomId}`, sid)
    }
    setSenderId(sid)
    senderIdRef.current = sid

    // 通知設定を復元
    const saved = localStorage.getItem(`notif:${roomId}`)
    if (saved === '1' && 'Notification' in window && Notification.permission === 'granted') {
      setNotifEnabled(true)
      notifEnabledRef.current = true
    }

    fetch(`/api/rooms/${roomId}/messages`)
      .then((r) => r.json())
      .then(({ messages: hist }) => {
        if (!Array.isArray(hist)) return
        const mapped: Message[] = hist.map((m: { id: number; sender_id: string; content: string; created_at: number }) => ({
          id: m.id,
          senderId: m.sender_id,
          content: m.content,
          createdAt: m.created_at,
        }))
        setMessages(mapped)
        // 相手のメッセージがあれば既読を送信
        if (mapped.some((m) => m.senderId !== senderIdRef.current)) {
          socketRef.current?.emit('mark_read', { roomId, readAt: Date.now() })
        }
      })

    const socket = io({ path: '/socket.io' })
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('join_room', { roomId, senderId: sid })
    })

    socket.on('disconnect', () => setIsConnected(false))

    socket.on('room_joined', ({ participantCount: count }: { participantCount: number }) => {
      setParticipantCount(count)
    })

    socket.on('user_joined', ({ participantCount: count }: { participantCount: number }) => {
      setParticipantCount(count)
      // 相手が入室したとき既読を送信（こちらがすでにメッセージを見ている）
      emitMarkRead()
    })

    socket.on('user_left', ({ participantCount: count }: { participantCount: number }) => {
      setParticipantCount(count)
    })

    socket.on('new_message', (msg: { id: number; senderId: string; content: string; createdAt: number }) => {
      setMessages((prev) => [...prev, msg])
      if (msg.senderId !== senderIdRef.current) {
        socket.emit('mark_read', { roomId, readAt: Date.now() })
        // 通知が有効かつタブが非表示のとき通知を表示
        if (notifEnabledRef.current && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('新しいメッセージ', {
            body: messagePreview(msg.content),
            icon: '/icon-192.png',
            tag: roomId,
          })
        }
      }
    })

    socket.on('partner_read', ({ readAt }: { readAt: number }) => {
      setPartnerReadAt(readAt)
    })

    socket.on('error', ({ message }: { message: string }) => {
      setErrorMsg(message)
    })

    return () => { socket.disconnect() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  function handleSend(content: string) {
    if (!socketRef.current || !senderId) return
    socketRef.current.emit('send_message', { roomId, senderId, content })
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-sm w-full">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">参加できませんでした</h2>
          <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
          <Link href="/" className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            新しい会話を作成
          </Link>
        </div>
      </div>
    )
  }

  const statusText = !isConnected
    ? '接続中...'
    : participantCount < 2
    ? '相手は未接続（メッセージは届きます）'
    : '相手と接続中'

  const statusColor = !isConnected
    ? 'bg-yellow-400'
    : participantCount < 2
    ? 'bg-gray-300'
    : 'bg-green-400'

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: '100dvh' }}>
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-gray-900">プライベートチャット</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${statusColor}`} />
            <span className="text-xs text-gray-500">{statusText}</span>
          </div>
        </div>
        <NotificationToggle enabled={notifEnabled} onToggle={handleNotifToggle} />
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          URLをコピー
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <MessageList messages={messages} senderId={senderId} partnerReadAt={partnerReadAt} />
      </div>

      <div className="flex-shrink-0">
        <MessageInput roomId={roomId} onSend={handleSend} disabled={!isConnected} />
      </div>
    </div>
  )
}
