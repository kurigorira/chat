interface Message {
  id: number
  senderId: string
  content: string
  createdAt: number
}

interface Props {
  message: Message
  isSelf: boolean
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, isSelf }: Props) {
  const isImage = message.content.startsWith('__img__:')
  const imageUrl = isImage ? message.content.slice('__img__:'.length) : ''

  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isSelf ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {isImage ? (
          <div className={`rounded-2xl overflow-hidden ${isSelf ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="送信された画像"
              className="max-w-full max-h-64 object-contain block"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap ${
              isSelf
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
            }`}
          >
            {message.content}
          </div>
        )}
        <span className="text-xs text-gray-400 px-1">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  )
}
