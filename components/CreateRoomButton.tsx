'use client'

import { useState } from 'react'

type State = 'idle' | 'loading' | 'created'

export default function CreateRoomButton() {
  const [state, setState] = useState<State>('idle')
  const [roomUrl, setRoomUrl] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleCreate() {
    setState('loading')
    try {
      const res = await fetch('/api/rooms', { method: 'POST' })
      const { roomId } = await res.json()
      const url = `${window.location.origin}/room/${roomId}`
      setRoomUrl(url)
      setState('created')
    } catch {
      setState('idle')
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(roomUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (state === 'idle' || state === 'loading') {
    return (
      <button
        onClick={handleCreate}
        disabled={state === 'loading'}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
      >
        {state === 'loading' ? '作成中...' : '新しい会話を作成'}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">会話URLが作成されました</p>

      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
        <span className="flex-1 text-xs text-gray-600 break-all text-left font-mono">
          {roomUrl}
        </span>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-1.5 px-3 rounded-lg transition-colors"
        >
          {copied ? 'コピー済み' : 'コピー'}
        </button>
      </div>

      <a
        href={roomUrl}
        className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
      >
        会話を開く
      </a>

      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-2 px-3">
        このURLを相手の1人だけに共有してください。
      </p>

      <button
        onClick={() => { setState('idle'); setRoomUrl('') }}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        別のルームを作成
      </button>
    </div>
  )
}
