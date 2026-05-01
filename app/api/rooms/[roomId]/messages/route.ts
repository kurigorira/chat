import { NextResponse } from 'next/server'
import { getRoom, getMessages } from '@/lib/db-queries'

export async function GET(
  _req: Request,
  { params }: { params: { roomId: string } }
) {
  const room = getRoom(params.roomId)
  if (!room) {
    return NextResponse.json({ messages: [] }, { status: 404 })
  }
  const messages = getMessages(params.roomId)
  return NextResponse.json({ messages })
}
