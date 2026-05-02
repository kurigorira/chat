interface Message {
  id: number
  senderId: string
  content: string
  createdAt: number
}

interface Props {
  message: Message
  isSelf: boolean
  showReadReceipt?: boolean
  readAt?: number
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, isSelf, showReadReceipt, readAt }: Props) {
  const isImage = message.content.startsWith('__img__:')
  const isLocation = message.content.startsWith('__location__:')

  const imageUrl = isImage ? message.content.slice('__img__:'.length) : ''
  const locationCoords = isLocation ? message.content.slice('__location__:'.length) : ''
  const [lat, lng] = locationCoords ? locationCoords.split(',') : []

  return (
    <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[75%] flex flex-col gap-1 ${isSelf ? 'items-end' : 'items-start'}`}>

        {/* 画像メッセージ */}
        {isImage && (
          <div className={`rounded-2xl overflow-hidden ${isSelf ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="送信された画像"
              className="max-w-full max-h-64 object-contain block"
              loading="lazy"
            />
          </div>
        )}

        {/* 位置情報メッセージ */}
        {isLocation && lat && lng && (
          <a
            href={`https://maps.google.com/?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm ${
              isSelf
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <div className="font-medium">現在地を共有</div>
              <div className={`text-xs mt-0.5 ${isSelf ? 'text-indigo-200' : 'text-gray-400'}`}>
                {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
              </div>
            </div>
          </a>
        )}

        {/* テキストメッセージ */}
        {!isImage && !isLocation && (
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

        {/* 時刻 + 既読 */}
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
          {showReadReceipt && readAt && (
            <span className="text-xs text-indigo-400">既読 {formatTime(readAt)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
