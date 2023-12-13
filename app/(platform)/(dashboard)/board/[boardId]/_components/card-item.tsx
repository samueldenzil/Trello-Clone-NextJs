import { Draggable } from '@hello-pangea/dnd'
import { Card } from '@prisma/client'

import { useCardModal } from '@/hooks/use-card-modal'

type CardItemProps = {
  data: Card
  index: number
}

export function CardItem({ data, index }: CardItemProps) {
  const { onOpen } = useCardModal()

  return (
    <Draggable draggableId={data.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          className="truncate rounded-md border-2 border-transparent bg-white px-3 py-2 text-sm shadow-sm hover:border-black"
          role="button"
          onClick={() => onOpen(data.id)}
        >
          {data.title}
        </div>
      )}
    </Draggable>
  )
}
