'use client'

import { DragDropContext, DropResult, Droppable } from '@hello-pangea/dnd'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { trpc } from '@/trpc/client'
import { ListWithCards } from '@/types'
import { ListForm } from './list-form'
import { ListItem } from './list-item'

type ListContainerProps = {
  boardId: string
  initialData: ListWithCards[]
}

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

export function ListContainer({ boardId, initialData }: ListContainerProps) {
  const { data, refetch: refetchLists } = trpc.list.getLists.useQuery(
    { boardId },
    {
      initialData: initialData as any,
    }
  )

  const [orderedData, setOrderedData] = useState(data)

  useEffect(() => {
    setOrderedData(data)
  }, [data])

  const { mutate: mutateUpdateListOrder } = trpc.list.updateListOrder.useMutation({
    onSuccess: () => {
      toast.success('List reordered')
      refetchLists()
    },
    onError: (err) => {
      toast.error(err.data?.code)
    },
  })

  const { mutate: mutateUpdateCardOrder } = trpc.card.updateCardOrder.useMutation({
    onSuccess: () => {
      toast.success('Card reordered')
      refetchLists()
    },
    onError: (err) => {
      toast.error(err.data?.code)
    },
  })

  const onDragEnd = (result: DropResult) => {
    const { destination, source, type } = result

    if (!destination) {
      return
    }

    // If dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    // User moves a list
    if (type === 'list') {
      const items = reorder(orderedData, source.index, destination.index).map((item, index) => ({
        ...item,
        order: index,
      }))
      setOrderedData(items)
      mutateUpdateListOrder({ items, boardId })
    }

    // User moves a card
    if (type === 'card') {
      const newOrderedData = [...orderedData]

      // Source and destination list
      const sourceList = newOrderedData.find((list) => list.id === source.droppableId)
      const destinationList = newOrderedData.find((list) => list.id === destination.droppableId)

      if (!sourceList || !destinationList) {
        return
      }

      // Check if cards exists in sourceList
      if (!sourceList.cards) {
        sourceList.cards = []
      }

      // Check if cards exists in destinationList
      if (!destinationList.cards) {
        destinationList.cards = []
      }

      // Moving the card in the same list
      if (source.droppableId === destination.droppableId) {
        const reorderedCards = reorder(sourceList.cards, source.index, destination.index)

        reorderedCards.forEach((card, idx) => {
          card.order = idx
        })

        sourceList.cards = reorderedCards

        setOrderedData(newOrderedData)
        mutateUpdateCardOrder({ boardId, items: reorderedCards })
      } else {
        // Moving the card in different list

        // Remove card from the source list
        const [movedCard] = sourceList.cards.splice(source.index, 1)

        // Assign the new listId to the moved card
        movedCard.listId = destination.droppableId

        // Add the card to destination list
        destinationList.cards.splice(destination.index, 0, movedCard)

        // Update the order for each card in the sourceList
        sourceList.cards.forEach((card, idx) => {
          card.order = idx
        })

        // Update the order for each card in the destinationList
        destinationList.cards.forEach((card, idx) => {
          card.order = idx
        })

        setOrderedData(newOrderedData)
        mutateUpdateCardOrder({ boardId, items: destinationList.cards })
      }
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="lists" type="list" direction="horizontal">
        {(provided) => (
          <ol {...provided.droppableProps} ref={provided.innerRef} className="flex h-full gap-x-3">
            {orderedData.map((list, index) => (
              <ListItem
                data={list as any}
                index={index}
                refetchLists={refetchLists}
                key={list.id}
              />
            ))}
            {provided.placeholder}
            <ListForm refetchLists={refetchLists} />
            <div className="w-1 flex-shrink-0" aria-hidden="true" />
          </ol>
        )}
      </Droppable>
    </DragDropContext>
  )
}
