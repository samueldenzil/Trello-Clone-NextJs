'use client'

import Image from 'next/image'
import { CreditCard } from 'lucide-react'
import { useOrganization } from '@clerk/nextjs'

import { Skeleton } from '@/components/ui/skeleton'

export function Info() {
  const { organization, isLoaded } = useOrganization()

  if (!isLoaded) {
    return <Info.Skeleton />
  }

  return (
    <div className="flex items-center gap-x-4">
      <div className="relative h-[60px] w-[60px]">
        <Image
          src={organization?.imageUrl!}
          alt="Organization"
          className="rounded-md object-cover"
          fill
        />
      </div>
      <div className="space-y-1">
        <p className="text-xl font-semibold">{organization?.name}</p>
        <div className="flex items-center text-xs text-muted-foreground">
          <CreditCard className="mr-1 h-3 w-3" />
          Free
        </div>
      </div>
    </div>
  )
}

Info.Skeleton = function InfoSkeleton() {
  return (
    <div className="flex items-center gap-x-4">
      <div className="relative h-[60px] w-[60px]">
        <Skeleton className="absolute h-full w-full" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-10 w-[200px]" />
        <div className="flex items-center text-xs text-muted-foreground">
          <Skeleton className="mr-1 h-4 w-4" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
    </div>
  )
}
