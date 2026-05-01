import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-6">ルームが見つかりません。URLを確認してください。</p>
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
          ホームに戻る
        </Link>
      </div>
    </main>
  )
}
