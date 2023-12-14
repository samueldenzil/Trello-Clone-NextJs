import { auth } from '@clerk/nextjs'
import { HelpCircle, User2 } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FormPopover } from '@/components/form/form-popover'
import { Hint } from '@/components/hint'
import { Skeleton } from '@/components/ui/skeleton'
import { MAX_FREE_BOARDS } from '@/constants/boards'
import prisma from '@/lib/db'
import { getAvailableCount } from '@/lib/org-limit'
import { checkSubscription } from '@/lib/subscription'

export async function BoardList() {
  const { orgId } = auth()

  if (!orgId) {
    return redirect('/select-org')
  }

  const boards = await prisma?.board.findMany({
    where: {
      orgId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const availableCount = await getAvailableCount()
  const isPro = await checkSubscription()

  return (
    <div className="space-y-4">
      <div className="flex items-center text-lg font-semibold text-neutral-700">
        <User2 className="mr-2 h-6 w-6" />
        Your boards
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {boards?.map((board) => (
          <Link
            href={`/board/${board.id}`}
            key={board.id}
            style={{ backgroundImage: `url(${board.imageThumbUrl})` }}
            className="group relative aspect-video h-full w-full overflow-hidden rounded-sm bg-sky-700 bg-cover bg-center bg-no-repeat p-2"
          >
            <div
              className="absolute inset-0 bg-black/30 transition group-hover:bg-black/40"
              aria-hidden="true"
            />
            <p className="relative font-semibold text-white">{board.title}</p>
          </Link>
        ))}
        <FormPopover side="right" sideOffset={10}>
          <div
            className="relative flex aspect-video h-full w-full flex-col items-center justify-center gap-y-1 rounded-sm bg-muted transition hover:opacity-75"
            role="button"
          >
            <p className="text-sm">Create new board</p>
            <span className="text-xs">
              {isPro ? 'Unlimited' : `${MAX_FREE_BOARDS - availableCount} remaining`}
            </span>
            <Hint
              description={`Free workspaces can have upto 5 open boards. For unlimited boards upgrade this workspace.`}
              sideOffset={40}
            >
              <HelpCircle className="absolute bottom-2 right-2 h-[14px] w-[14px]" />
            </Hint>
          </div>
        </FormPopover>
      </div>
    </div>
  )
}

BoardList.Skeleton = function BoardListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Skeleton className="mr-2 h-7 w-7" />
        <Skeleton className="h-7 w-[150px]" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Skeleton className="aspect-video h-full w-full" />
        <Skeleton className="aspect-video h-full w-full" />
        <Skeleton className="aspect-video h-full w-full" />
        <Skeleton className="aspect-video h-full w-full" />
        <Skeleton className="aspect-video h-full w-full" />
        <Skeleton className="aspect-video h-full w-full" />
      </div>
    </div>
  )
}
