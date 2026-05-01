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
}

export default function MessageList({ messages, senderId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">まだメッセージはありません。最初のメッセージを送りましょう。</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isSelf={msg.senderId === senderId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
