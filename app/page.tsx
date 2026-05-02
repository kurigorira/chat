import CreateRoomButton from '@/components/CreateRoomButton'
import InstallPrompt from '@/components/InstallPrompt'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">プライベートチャット</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              URLを知っている人だけが参加できる<br />
              1対1の非公開チャットルームを作成します。
            </p>
          </div>

          <CreateRoomButton />

          <p className="mt-6 text-xs text-gray-400">
            作成したURLを相手に共有するだけで会話を始められます。<br />
            URLを知らない人は参加できません。
          </p>
        </div>

        <InstallPrompt />
      </div>
    </main>
  )
}
