'use client'

import { useRef, useState, KeyboardEvent } from 'react'

interface Props {
  roomId: string
  onSend: (content: string) => void
  disabled?: boolean
}

export default function MessageInput({ roomId, onSend, disabled }: Props) {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [actionError, setActionError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploading(true)
    setActionError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/rooms/${roomId}/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setActionError(data.error || 'アップロードに失敗しました')
        return
      }
      onSend(`__img__:${data.url}`)
    } catch {
      setActionError('アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  function handleLocation() {
    if (!navigator.geolocation) {
      setActionError('この端末では位置情報を取得できません')
      return
    }
    setLocating(true)
    setActionError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        onSend(`__location__:${latitude},${longitude}`)
        setLocating(false)
      },
      () => {
        setActionError('位置情報の取得に失敗しました。許可を確認してください')
        setLocating(false)
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="border-t border-gray-200 bg-white px-3 pt-3 pb-3 pb-safe">
      {actionError && (
        <p className="text-xs text-red-500 mb-2 px-1">{actionError}</p>
      )}
      <div className="flex items-end gap-2">
        {/* 画像添付ボタン */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex-shrink-0 text-gray-400 hover:text-indigo-500 disabled:text-gray-200 p-2 rounded-xl transition-colors"
          title="画像を添付"
        >
          {uploading ? (
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 位置情報ボタン */}
        <button
          type="button"
          onClick={handleLocation}
          disabled={disabled || locating}
          className="flex-shrink-0 text-gray-400 hover:text-indigo-500 disabled:text-gray-200 p-2 rounded-xl transition-colors"
          title="現在地を送信"
        >
          {locating ? (
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>

        {/* テキスト入力 */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? '接続を待っています...' : 'メッセージを入力'}
          rows={1}
          className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 max-h-32 overflow-y-auto"
          style={{ minHeight: '44px' }}
        />

        {/* 送信ボタン */}
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-200 disabled:text-gray-400 text-white p-3 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
