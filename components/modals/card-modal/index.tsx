import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useCardModal } from '@/hooks/use-card-modal'
import { trpc } from '@/trpc/client'
import { Actions } from './actions'
import { Activity } from './activity'
import { Description } from './description'
import { Header } from './header'

export function CardModal() {
  const { isOpen, onClose, onOpen, id, refetchLists } = useCardModal()

  const { data: cardData, refetch: refetchCard } = trpc.card.getCard.useQuery({
    id: id ?? '',
  })

  const { data: dataAuditLogs, refetch: refetchAuditLogs } = trpc.getLogs.useQuery({
    cardId: id ?? '',
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {!cardData ? (
          <Header.Skeleton />
        ) : (
          <Header
            data={cardData as any}
            refetchCard={refetchCard}
            refetchLists={refetchLists}
            refetchAuditLogs={refetchAuditLogs}
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-4">
          <div className="col-span-3">
            <div className="w-full space-y-6">
              {!cardData ? (
                <Description.Skeleton />
              ) : (
                <Description
                  data={cardData as any}
                  refetchCard={refetchCard}
                  refetchLists={refetchLists}
                  refetchAuditLogs={refetchAuditLogs}
                />
              )}
              {!dataAuditLogs ? <Activity.Skeleton /> : <Activity items={dataAuditLogs as any} />}
            </div>
          </div>
          {!cardData ? (
            <Actions.Skeleton />
          ) : (
            <Actions data={cardData as any} refetchLists={refetchLists} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
