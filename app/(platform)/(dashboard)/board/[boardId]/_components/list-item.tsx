'use client'

import { ElementRef, useRef, useState } from 'react'
import { Draggable, Droppable } from '@hello-pangea/dnd'

import { cn } from '@/lib/utils'
import { ListWithCards } from '@/types'
import { CardForm } from './card-form'
import { CardItem } from './card-item'
import { ListHeader } from './list-header'

type ListItemProps = {
  data: ListWithCards
  index: number
  refetchLists: any
}

export function ListItem({ data, index, refetchLists }: ListItemProps) {
  const textAreaRef = useRef<ElementRef<'textarea'>>(null)

  const [isEditing, setIsEditing] = useState(false)

  const enableEditing = () => {
    setIsEditing(true)
    setTimeout(() => {
      textAreaRef.current?.focus()
    })
  }

  const disableEditing = () => {
    setIsEditing(false)
  }

  return (
    <Draggable draggableId={data.id} index={index}>
      {(provided) => (
        <li
          {...provided.draggableProps}
          ref={provided.innerRef}
          className="h-full w-[272px] shrink-0 select-none"
        >
          <div
            {...provided.dragHandleProps}
            className="w-full rounded-md bg-[#f1f2f4] pb-2 shadow-md"
          >
            <ListHeader data={data} onAddCard={enableEditing} refetchLists={refetchLists} />
            <Droppable droppableId={data.id} type="card">
              {(provided) => (
                <ol
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    'mx-1 flex flex-col gap-y-2 px-1 py-0.5',
                    data.cards.length > 0 ? 'mt-2' : 'mt-0'
                  )}
                >
                  {data.cards.map((card, index) => (
                    <CardItem data={card} index={index} refetchLists={refetchLists} key={card.id} />
                  ))}
                  {provided.placeholder}
                </ol>
              )}
            </Droppable>
            <CardForm
              listId={data.id}
              isEditing={isEditing}
              enableEditing={enableEditing}
              disableEditing={disableEditing}
              refetchLists={refetchLists}
            />
          </div>
        </li>
      )}
    </Draggable>
  )
}
