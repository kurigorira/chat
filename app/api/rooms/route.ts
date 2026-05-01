import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createRoom } from '@/lib/db-queries'

export async function POST() {
  const roomId = nanoid(21)
  createRoom(roomId)
  return NextResponse.json({ roomId })
}
