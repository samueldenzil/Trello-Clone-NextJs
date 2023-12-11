import { ListWithCards } from '@/types'
import { ListForm } from './list-form'

type ListContainerProps = {
  boardId: string
  data: ListWithCards[]
}

export function ListContainer({ boardId, data }: ListContainerProps) {
  return (
    <ol>
      <ListForm />
      <div className="w-1 flex-shrink-0" aria-hidden="true" />
    </ol>
  )
}
