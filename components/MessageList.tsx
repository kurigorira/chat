'use client'

import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

interface Message {
  id: number
  senderId: string
  content: string
  createdAt: number
}

interface Props {
  messages: Message[]
  senderId: string
  partnerReadAt: number | null
}

export default function MessageList({ messages, senderId, partnerReadAt }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 既読マークを表示する最後のメッセージIDを求める
  let lastReadMessageId: number | null = null
  if (partnerReadAt !== null) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.senderId === senderId && msg.createdAt <= partnerReadAt) {
        lastReadMessageId = msg.id
        break
      }
    }
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <p className="text-gray-400 text-sm text-center">まだメッセージはありません。<br />最初のメッセージを送りましょう。</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isSelf={msg.senderId === senderId}
          showReadReceipt={msg.id === lastReadMessageId}
          readAt={partnerReadAt ?? undefined}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
