'use client'

import { useEffect, useState } from 'react'

interface Props {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

type Step = 'idle' | 'guide' | 'denied'

export default function NotificationToggle({ enabled, onToggle }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsIOS(ios)
    setIsStandalone(standalone)
    // iOSはホーム画面追加済み(PWA)でないと通知不可
    if (ios && !standalone) setSupported(false)
    if (!('Notification' in window)) setSupported(false)
  }, [])

  async function handleEnable() {
    if (!supported) return
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      onToggle(true)
      setStep('idle')
    } else if (perm === 'denied') {
      setStep('denied')
    }
  }

  function handleBellClick() {
    if (enabled) {
      onToggle(false)
      return
    }
    if (!supported) {
      setStep('guide')
      return
    }
    if (Notification.permission === 'granted') {
      onToggle(true)
      return
    }
    if (Notification.permission === 'denied') {
      setStep('denied')
      return
    }
    setStep('guide')
  }

  return (
    <>
      {/* ベルアイコン */}
      <button
        onClick={handleBellClick}
        className={`p-1.5 rounded-lg transition-colors ${
          enabled
            ? 'text-indigo-600 bg-indigo-50'
            : 'text-gray-400 hover:text-gray-600'
        }`}
        title={enabled ? '通知オン' : '通知オフ'}
      >
        {enabled ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )}
      </button>

      {/* ガイドモーダル */}
      {step !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={() => setStep('idle')}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">通知について</h2>
                <button onClick={() => setStep('idle')} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {step === 'denied' ? (
                <DeniedGuide isIOS={isIOS} />
              ) : isIOS && !isStandalone ? (
                <IOSGuide />
              ) : (
                <EnableGuide isIOS={isIOS} isStandalone={isStandalone} onEnable={handleEnable} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function EnableGuide({ isIOS, isStandalone, onEnable }: { isIOS: boolean; isStandalone: boolean; onEnable: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-sm text-blue-800 font-medium mb-1">通知できること</p>
        <p className="text-xs text-blue-700 leading-relaxed">
          このサイトを開いていない間（他のアプリを使っている間）に相手がメッセージを送ると、スマホに通知が届きます。
        </p>
      </div>

      <div className="bg-amber-50 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-medium mb-1">通知できないこと</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          ブラウザを完全に終了している場合は通知が届きません。ブラウザがバックグラウンドで動いている必要があります。
          {isIOS && isStandalone && (
            <> iPhoneでホーム画面から起動している場合は通知が届きます。</>
          )}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700">許可の手順：</p>
        <ol className="space-y-1.5">
          <li className="flex gap-2 text-xs text-gray-600">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
            下の「通知を許可する」をタップ
          </li>
          <li className="flex gap-2 text-xs text-gray-600">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
            {isIOS
              ? '「許可」をタップ'
              : 'ブラウザの確認ポップアップで「許可」をタップ'}
          </li>
          <li className="flex gap-2 text-xs text-gray-600">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">3</span>
            ベルアイコンが青くなれば設定完了
          </li>
        </ol>
      </div>

      <button
        onClick={onEnable}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        通知を許可する
      </button>
    </div>
  )
}

function IOSGuide() {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-medium mb-1">iPhoneの場合</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          iPhoneのSafariでは、ホーム画面に追加（PWAとしてインストール）してから起動した場合のみ通知が使えます。
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700">ホーム画面への追加手順：</p>
        <ol className="space-y-1.5">
          <li className="flex gap-2 text-xs text-gray-600">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
            画面下の <span className="font-bold">共有ボタン（□↑）</span> をタップ
          </li>
          <li className="flex gap-2 text-xs text-gray-600">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
            「ホーム画面に追加」を選択
          </li>
          <li className="flex gap-2 text-xs text-gray-600">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">3</span>
            ホーム画面のアイコンからアプリを起動
          </li>
          <li className="flex gap-2 text-xs text-gray-600">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">4</span>
            ベルアイコンをタップして通知を許可
          </li>
        </ol>
      </div>
    </div>
  )
}

function DeniedGuide({ isIOS }: { isIOS: boolean }) {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 rounded-xl p-4">
        <p className="text-sm text-red-800 font-medium mb-1">通知がブロックされています</p>
        <p className="text-xs text-red-700 leading-relaxed">
          以前に「拒否」を選択したため、通知が許可されていません。以下の手順で再度許可してください。
        </p>
      </div>

      {isIOS ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">iPhoneの設定方法：</p>
          <ol className="space-y-1.5">
            <li className="flex gap-2 text-xs text-gray-600">
              <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
              iPhoneの「設定」アプリを開く
            </li>
            <li className="flex gap-2 text-xs text-gray-600">
              <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
              「通知」→ このアプリを選択
            </li>
            <li className="flex gap-2 text-xs text-gray-600">
              <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">3</span>
              「通知を許可」をオンにする
            </li>
          </ol>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Androidの設定方法：</p>
          <ol className="space-y-1.5">
            <li className="flex gap-2 text-xs text-gray-600">
              <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
              アドレスバー左の 🔒 または ⓘ をタップ
            </li>
            <li className="flex gap-2 text-xs text-gray-600">
              <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
              「権限」→「通知」を選択
            </li>
            <li className="flex gap-2 text-xs text-gray-600">
              <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]">3</span>
              「許可」に変更してページを再読み込み
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
