import { NextResponse } from 'next/server'
import { getRoom, saveParticipantEmail, getRoomEmails } from '@/lib/db-queries'

export async function POST(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const room = getRoom(params.roomId)
  if (!room) return NextResponse.json({ error: 'ルームが見つかりません' }, { status: 404 })

  const { senderId, email } = await req.json()
  if (!senderId || !email) return NextResponse.json({ error: 'パラメータが不足しています' }, { status: 400 })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return NextResponse.json({ error: 'メールアドレスの形式が正しくありません' }, { status: 400 })

  saveParticipantEmail(params.roomId, senderId, email)
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const { senderId } = await req.json()
  if (!senderId) return NextResponse.json({ error: 'パラメータが不足しています' }, { status: 400 })

  // メール通知を解除（空文字で上書きではなく行を削除）
  const { default: db } = await import('@/lib/db')
  db.prepare('DELETE FROM participant_emails WHERE room_id = ? AND sender_id = ?').run(params.roomId, senderId)
  return NextResponse.json({ ok: true })
}
