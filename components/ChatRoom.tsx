'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
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

export default function ChatRoom({ roomId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [senderId, setSenderId] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Retrieve or generate senderId
    let sid = sessionStorage.getItem(`senderId:${roomId}`)
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem(`senderId:${roomId}`, sid)
    }
    setSenderId(sid)

    // Load message history
    fetch(`/api/rooms/${roomId}/messages`)
      .then((r) => r.json())
      .then(({ messages: hist }) => {
        if (!Array.isArray(hist)) return
        setMessages(
          hist.map((m: { id: number; sender_id: string; content: string; created_at: number }) => ({
            id: m.id,
            senderId: m.sender_id,
            content: m.content,
            createdAt: m.created_at,
          }))
        )
      })

    // Connect socket
    const socket = io({ path: '/socket.io' })
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('join_room', { roomId, senderId: sid })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('room_joined', ({ participantCount: count }: { participantCount: number }) => {
      setParticipantCount(count)
    })

    socket.on('user_joined', ({ participantCount: count }: { participantCount: number }) => {
      setParticipantCount(count)
    })

    socket.on('user_left', ({ participantCount: count }: { participantCount: number }) => {
      setParticipantCount(count)
    })

    socket.on('new_message', (msg: { id: number; senderId: string; content: string; createdAt: number }) => {
      setMessages((prev) => [...prev, msg])
    })

    socket.on('error', ({ message }: { message: string }) => {
      setErrorMsg(message)
    })

    return () => {
      socket.disconnect()
    }
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
    ? '相手の参加を待っています...'
    : '接続済み'

  const statusColor = !isConnected
    ? 'bg-yellow-400'
    : participantCount < 2
    ? 'bg-yellow-400'
    : 'bg-green-400'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
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
        <button
          onClick={() => {
            const url = window.location.href
            navigator.clipboard.writeText(url)
          }}
          className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          title="URLをコピー"
        >
          URLをコピー
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MessageList messages={messages} senderId={senderId} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        disabled={!isConnected || participantCount < 2}
      />
    </div>
  )
}
