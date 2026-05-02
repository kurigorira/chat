'use client'

import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void } | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
    setDismissed(sessionStorage.getItem('install-dismissed') === '1')

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt: () => void })
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    sessionStorage.setItem('install-dismissed', '1')
    setDismissed(true)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    setDeferredPrompt(null)
    dismiss()
  }

  // インストール済み or 非表示 or 対象外なら何も表示しない
  if (isStandalone || dismissed) return null

  // Android Chrome: インストールバナー
  if (deferredPrompt) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-indigo-900">ホーム画面に追加</p>
          <p className="text-xs text-indigo-600 mt-0.5">アプリとして使えます</p>
        </div>
        <div className="flex gap-2">
          <button onClick={dismiss} className="text-xs text-indigo-400 hover:text-indigo-600 px-2 py-1">後で</button>
          <button onClick={handleInstall} className="text-xs bg-indigo-600 text-white font-medium px-3 py-1.5 rounded-lg">追加</button>
        </div>
      </div>
    )
  }

  // iOS Safari: 手動手順を案内
  if (isIOS) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-indigo-900">ホーム画面に追加できます</p>
            <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
              下の <span className="font-bold">共有ボタン（□↑）</span> をタップ →<br />
              「ホーム画面に追加」を選択
            </p>
          </div>
          <button onClick={dismiss} className="text-indigo-400 hover:text-indigo-600 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return null
}
