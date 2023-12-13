import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

import prisma from '@/lib/db'
import { ListContainer } from './_components/list-container'

export default async function BoardIdPage({ params }: { params: { boardId: string } }) {
  const { orgId } = auth()

  if (!orgId) {
    redirect('/select-org')
  }

  const list = await prisma.list.findMany({
    where: {
      boardId: params.boardId,
      board: {
        orgId,
      },
    },
    include: {
      cards: {
        orderBy: {
          order: 'asc',
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  })

  return (
    <div className="w-full overflow-x-auto p-4">
      <ListContainer boardId={params.boardId} initialData={list} />
    </div>
  )
}
