import { notFound } from 'next/navigation'
import { getRoom } from '@/lib/db-queries'
import ChatRoom from '@/components/ChatRoom'

interface Props {
  params: { roomId: string }
}

export default function RoomPage({ params }: Props) {
  const room = getRoom(params.roomId)
  if (!room) notFound()

  return <ChatRoom roomId={params.roomId} />
}
