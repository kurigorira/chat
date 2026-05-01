import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'プライベートチャット',
  description: 'URLを知っている人だけが参加できる1対1のプライベートチャット',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
