'use client'

import { DragDropContext, Droppable } from '@hello-pangea/dnd'
import { useEffect, useState } from 'react'

import { ListWithCards } from '@/types'
import { ListForm } from './list-form'
import { ListItem } from './list-item'

type ListContainerProps = {
  boardId: string
  data: ListWithCards[]
}

export function ListContainer({ boardId, data }: ListContainerProps) {
  const [orderedData, setOrderedData] = useState(data)

  useEffect(() => {
    setOrderedData(data)
  }, [data])

  return (
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="lists" type="list" direction="horizontal">
        {(provided) => (
          <ol {...provided.droppableProps} ref={provided.innerRef} className="flex h-full gap-x-3">
            {orderedData.map((list, index) => (
              <ListItem data={list} index={index} key={list.id} />
            ))}
            {provided.placeholder}
            <ListForm />
            <div className="w-1 flex-shrink-0" aria-hidden="true" />
          </ol>
        )}
      </Droppable>
    </DragDropContext>
  )
}
