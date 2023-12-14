'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useProModal } from '@/hooks/use-pro-modal'
import { trpc } from '@/trpc/client'

type SubscriptionButtonProps = {
  isPro: boolean
}

export function SubscriptionButton({ isPro }: SubscriptionButtonProps) {
  const { onOpen } = useProModal()

  const { mutate } = trpc.stripeRedirect.useMutation({
    onSuccess: (data) => {
      window.location.href = data
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const onClick = () => {
    if (isPro) {
      mutate()
    } else {
      onOpen()
    }
  }

  return (
    <Button variant="primary" onClick={onClick}>
      {isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
    </Button>
  )
}
