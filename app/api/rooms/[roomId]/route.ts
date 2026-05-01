import { NextResponse } from 'next/server'
import { getRoom } from '@/lib/db-queries'

export async function GET(
  _req: Request,
  { params }: { params: { roomId: string } }
) {
  const room = getRoom(params.roomId)
  if (!room) {
    return NextResponse.json({ exists: false }, { status: 404 })
  }
  return NextResponse.json({ exists: true, createdAt: room.created_at })
}
