import { NextResponse } from 'next/server'
import { getRoom } from '@/lib/db-queries'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
}

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const room = getRoom(params.roomId)
  if (!room) {
    return NextResponse.json({ error: 'ルームが見つかりません' }, { status: 404 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 })
  }

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    return NextResponse.json({ error: '画像ファイル（JPEG/PNG/GIF/WebP）のみ対応しています' }, { status: 400 })
  }

  const dataDir = process.env.DATABASE_DIR || path.join(process.cwd(), 'data')
  const uploadDir = path.join(dataDir, 'uploads', params.roomId)
  fs.mkdirSync(uploadDir, { recursive: true })

  const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`
  const filePath = path.join(uploadDir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filePath, buffer)

  const url = `/api/files/${params.roomId}/${filename}`
  return NextResponse.json({ url })
}
