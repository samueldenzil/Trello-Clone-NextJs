import { Suspense } from 'react'

import { Separator } from '@/components/ui/separator'
import { checkSubscription } from '@/lib/subscription'
import { BoardList } from './_components/board-list'
import { Info } from './_components/info'

export default async function OrganizationIdPage() {
  const isPro = await checkSubscription()

  return (
    <div className="mb-20 w-full">
      <Info isPro={isPro} />
      <Separator className="my-4" />
      <div className="px-2 md:px-4">
        <Suspense fallback={<BoardList.Skeleton />}>
          <BoardList />
        </Suspense>
      </div>
    </div>
  )
}
