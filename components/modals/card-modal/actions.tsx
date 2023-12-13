import { Copy, Trash } from 'lucide-react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCardModal } from '@/hooks/use-card-modal'
import { trpc } from '@/trpc/client'
import { CardWithList } from '@/types'

type ActionsProps = {
  data: CardWithList
  refetchLists: any
}

export function Actions({ data, refetchLists }: ActionsProps) {
  const params = useParams()
  const { onClose } = useCardModal()

  const { mutate: mutateCopyCard, isLoading: isLoadingCopyCard } = trpc.card.copyCard.useMutation({
    onSuccess: ({ card }) => {
      toast.success(`Card "${card.title}" copied`)
      refetchLists()
      onClose()
    },
    onError: (err) => {
      toast.error(err.data?.code)
    },
  })

  const { mutate: mutateDeleteCard, isLoading: isLoadingDeleteCard } =
    trpc.card.deleteCard.useMutation({
      onSuccess: ({ card }) => {
        toast.success(`Card "${card.title}" deleted`)
        refetchLists()
        onClose()
      },
      onError: (err) => {
        toast.error(err.data?.code)
      },
    })

  const onCopy = () => {
    mutateCopyCard({ id: data.id, boardId: params.boardId as string })
  }

  const onDelete = () => {
    mutateDeleteCard({ id: data.id, boardId: params.boardId as string })
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm font-semibold">Actions</p>
      <Button
        variant="gray"
        size="inline"
        className="w-full justify-start"
        disabled={isLoadingCopyCard}
        onClick={onCopy}
      >
        <Copy className="mr-2 h-4 w-4" aria-hidden="true" /> Copy
      </Button>
      <Button
        variant="gray"
        size="inline"
        className="w-full justify-start"
        disabled={isLoadingDeleteCard}
        onClick={onDelete}
      >
        <Trash className="mr-2 h-4 w-4" aria-hidden="true" /> Delete
      </Button>
    </div>
  )
}

Actions.Skeleton = function ActionsSkeleton() {
  return (
    <div className="mt-2 space-y-2">
      <Skeleton className="h-4 w-20 bg-neutral-200" />
      <Skeleton className="h-8 w-full bg-neutral-200" />
      <Skeleton className="h-8 w-full bg-neutral-200" />
    </div>
  )
}
