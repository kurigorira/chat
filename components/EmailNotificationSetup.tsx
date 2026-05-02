'use client'

import { useEffect, useState } from 'react'

interface Props {
  roomId: string
  senderId: string
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

export default function EmailNotificationSetup({ roomId, senderId }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [savedEmail, setSavedEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(`email-notif:${roomId}`)
    if (stored) {
      setSavedEmail(stored)
      setEmail(stored)
    }
  }, [roomId])

  async function handleSave() {
    if (!email.trim()) return
    setStatus('saving')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/rooms/${roomId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId, email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || '保存に失敗しました')
        setStatus('error')
        return
      }
      setSavedEmail(email.trim())
      localStorage.setItem(`email-notif:${roomId}`, email.trim())
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setErrorMsg('保存に失敗しました')
      setStatus('error')
    }
  }

  async function handleRemove() {
    try {
      await fetch(`/api/rooms/${roomId}/notify`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId }),
      })
      setSavedEmail('')
      setEmail('')
      localStorage.removeItem(`email-notif:${roomId}`)
      setStatus('idle')
    } catch {
      // silent
    }
  }

  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>メール通知</span>
          {savedEmail && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">オン</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {savedEmail ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-800">通知先メール</p>
                  <p className="text-xs text-green-700 mt-0.5">{savedEmail}</p>
                </div>
                <button
                  onClick={handleRemove}
                  className="text-xs text-red-400 hover:text-red-600 ml-4"
                >
                  解除
                </button>
              </div>
              <p className="text-xs text-green-600 mt-2">
                ブラウザを閉じているときに相手からメッセージが届くと、このアドレスに通知メールが送られます（10分に1通）。
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-700 leading-relaxed">
                ブラウザを完全に閉じていても、相手がメッセージを送ったときにメールで通知が届きます。
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              onClick={handleSave}
              disabled={status === 'saving' || !email.trim()}
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              {status === 'saving' ? '保存中…' : status === 'saved' ? '保存済み ✓' : '保存'}
            </button>
          </div>

          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

          <p className="text-xs text-gray-400">
            ※ このメールアドレスはこのチャットルーム専用です。他の人には表示されません。
          </p>
        </div>
      )}
    </div>
  )
}
