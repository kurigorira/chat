import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const dataDir = process.env.DATABASE_DIR || path.join(process.cwd(), 'data')
  // Prevent path traversal
  const safePath = params.path.map((s) => path.basename(s))
  const filePath = path.join(dataDir, 'uploads', ...safePath)

  if (!fs.existsSync(filePath)) {
    return new NextResponse(null, { status: 404 })
  }

  const ext = path.extname(filePath).toLowerCase()
  const mimeType = MIME_TYPES[ext]
  if (!mimeType) {
    return new NextResponse(null, { status: 403 })
  }

  const buffer = fs.readFileSync(filePath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
