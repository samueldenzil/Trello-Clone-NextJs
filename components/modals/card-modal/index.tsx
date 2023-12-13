import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCardModal } from '@/hooks/use-card-modal'
import { trpc } from '@/trpc/client'
import { CardWithList } from '@/types'
import { Header } from './header'

export function CardModal() {
  const { isOpen, onClose, onOpen, id } = useCardModal()

  const { data: cardData, refetch: refetchCard } = trpc.getCard.useQuery({
    id: id ?? '',
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          {!cardData ? (
            <Header.Skeleton />
          ) : (
            <Header data={cardData as any} refetchCard={refetchCard} />
          )}
          <DialogTitle>{cardData?.title}</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your
            data from our servers.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
